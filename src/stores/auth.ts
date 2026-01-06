import { create } from "zustand"

import { FirebaseError } from "firebase/app"
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from "firebase/auth"
import {
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore"

import { auth, db } from "@/firebase"

export type AuthUser = {
  uid: string
  isAnonymous: boolean
  displayName: string | null
  email: string | null
  photoURL: string | null
}

type AuthStore = {
  user: AuthUser | null
  isReady: boolean
  isWorking: boolean
  error: string | null
  postSaveLoginPromptOpen: boolean
  init: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  logoutToAnonymous: () => Promise<void>
  openLoginPrompt: () => void
  openPostSaveLoginPrompt: () => void
  closePostSaveLoginPrompt: () => void
  clearError: () => void
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  }
}

function formatAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    const code = err.code || "firebase-error"
    const msg = err.message || ""
    return msg ? `${code}: ${msg}` : code
  }
  if (err instanceof Error) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

async function upsertUserProfile(user: User): Promise<void> {
  if (user.isAnonymous) return

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

async function commitBatchedUpdates(
  updates: Array<{ refPath: string; data: Record<string, unknown> }>
): Promise<void> {
  const chunkSize = 450
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize)
    const batch = writeBatch(db)
    chunk.forEach((update) => {
      batch.update(doc(db, update.refPath), update.data)
    })
    await batch.commit()
  }
}

async function migrateUserData(fromUid: string, toUid: string): Promise<void> {
  if (!fromUid || !toUid || fromUid === toUid) return

  const conversationsCol = collection(db, "conversations")

  const authoredSnap = await getDocs(query(conversationsCol, where("authorUid", "==", fromUid)))
  const authoredUpdates = authoredSnap.docs.map((d) => ({
    refPath: d.ref.path,
    data: { authorUid: toUid, updatedAt: serverTimestamp() },
  }))

  const heartsField = `heartsByUid.${fromUid}`
  const heartedSnap = await getDocs(query(conversationsCol, where(heartsField, "==", true)))
  const heartedUpdates = heartedSnap.docs.map((d) => ({
    refPath: d.ref.path,
    data: {
      [`heartsByUid.${toUid}`]: true,
      [`heartsByUid.${fromUid}`]: deleteField(),
    },
  }))

  const merged = new Map<string, Record<string, unknown>>()
  ;[...authoredUpdates, ...heartedUpdates].forEach((u) => {
    const existing = merged.get(u.refPath) ?? {}
    merged.set(u.refPath, { ...existing, ...u.data })
  })

  await commitBatchedUpdates(
    Array.from(merged.entries()).map(([refPath, data]) => ({ refPath, data }))
  )
}

let initPromise: Promise<void> | null = null

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isReady: false,
  isWorking: false,
  error: null,
  postSaveLoginPromptOpen: false,
  init: async () => {
    if (initPromise) return initPromise

    initPromise = (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch (err) {
        console.warn("Failed to set auth persistence; continuing with default.", err)
      }

      await new Promise<void>((resolve) => {
        let handledInitial = false

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          try {
            if (!handledInitial) {
              handledInitial = true

              if (fbUser) {
                set({ user: toAuthUser(fbUser), isReady: true })
                void upsertUserProfile(fbUser)
                resolve()
                return
              }

              const credential = await signInAnonymously(auth)
              set({ user: toAuthUser(credential.user), isReady: true })
              resolve()
              return
            }

            if (!fbUser) {
              set({ user: null, isReady: true })
              return
            }

            set({ user: toAuthUser(fbUser), isReady: true })
            void upsertUserProfile(fbUser)
          } catch (err) {
            console.error(err)
            set({ error: "Failed to initialize authentication.", isReady: true })
            resolve()
          }
        })

        void unsubscribe
      })
    })().catch((err: unknown) => {
      console.error(err)
      set({ error: "Failed to initialize authentication.", isReady: true })
      throw err
    })

    return initPromise
  },
  signInWithGoogle: async () => {
    set({ isWorking: true, error: null })
    try {
      const provider = new GoogleAuthProvider()
      const existingUser = auth.currentUser
      const fromUid = existingUser?.uid ?? ""

      let credential: UserCredential | null = null

      if (existingUser && existingUser.isAnonymous) {
        try {
          credential = await linkWithPopup(existingUser, provider)
        } catch (err: unknown) {
          if (err instanceof FirebaseError && err.code === "auth/credential-already-in-use") {
            const extracted = GoogleAuthProvider.credentialFromError(err)
            if (!extracted) throw err

            credential = await signInWithCredential(auth, extracted)
            await migrateUserData(fromUid, credential.user.uid)
          } else {
            throw err
          }
        }
      } else {
        credential = await signInWithPopup(auth, provider)
      }

      const nextUser = credential?.user ?? auth.currentUser
      if (nextUser) {
        const googleProfile = nextUser.providerData.find((p) => p.providerId === "google.com")

        if (
          googleProfile &&
          (!nextUser.displayName || !nextUser.photoURL) &&
          (googleProfile.displayName || googleProfile.photoURL)
        ) {
          await updateProfile(nextUser, {
            displayName: nextUser.displayName ?? googleProfile.displayName ?? null,
            photoURL: nextUser.photoURL ?? googleProfile.photoURL ?? null,
          })
        }

        await nextUser.reload()
        set({ user: toAuthUser(nextUser) })
        await upsertUserProfile(nextUser)
      }

      set({ postSaveLoginPromptOpen: false })
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        console.error("Google sign-in failed (FirebaseError)", {
          code: err.code,
          message: err.message,
          customData: err.customData,
          name: err.name,
        })
      } else {
        console.error("Google sign-in failed", err)
      }

      set({ error: `Google sign-in failed: ${formatAuthError(err)}` })
      throw err
    } finally {
      set({ isWorking: false })
    }
  },
  logoutToAnonymous: async () => {
    set({ isWorking: true, error: null })
    try {
      await signOut(auth)
      const credential = await signInAnonymously(auth)
      set({ user: toAuthUser(credential.user) })
    } catch (err) {
      console.error(err)
      set({ error: "Logout failed. Please try again." })
      throw err
    } finally {
      set({ isWorking: false })
    }
  },
  openLoginPrompt: () => {
    const user = get().user
    if (user && !user.isAnonymous) return
    set({ postSaveLoginPromptOpen: true })
  },
  openPostSaveLoginPrompt: () => {
    const user = get().user
    if (!user || !user.isAnonymous) return
    set({ postSaveLoginPromptOpen: true })
  },
  closePostSaveLoginPrompt: () => set({ postSaveLoginPromptOpen: false }),
  clearError: () => set({ error: null }),
}))
