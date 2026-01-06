import { create } from "zustand"

import { doc, getDoc } from "firebase/firestore"

import { db } from "@/firebase"

export type UserProfile = {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

type UserProfilesStore = {
  profilesByUid: Record<string, UserProfile | null>
  isLoadingByUid: Record<string, boolean>
  loadProfiles: (uids: string[]) => Promise<void>
}

function normalizeUids(uids: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []
  uids.forEach((uid) => {
    const trimmed = uid.trim()
    if (!trimmed) return
    if (seen.has(trimmed)) return
    seen.add(trimmed)
    normalized.push(trimmed)
  })
  return normalized
}

export const useUserProfilesStore = create<UserProfilesStore>((set, get) => ({
  profilesByUid: {},
  isLoadingByUid: {},
  loadProfiles: async (uids) => {
    const normalized = normalizeUids(uids)
    if (normalized.length === 0) return

    const { profilesByUid, isLoadingByUid } = get()
    const toFetch = normalized.filter((uid) => profilesByUid[uid] === undefined && !isLoadingByUid[uid])
    if (toFetch.length === 0) return

    set((state) => ({
      isLoadingByUid: {
        ...state.isLoadingByUid,
        ...(Object.fromEntries(toFetch.map((uid) => [uid, true])) as Record<string, boolean>),
      },
    }))

    try {
      const results = await Promise.all(
        toFetch.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, "users", uid))
            if (!snap.exists()) return [uid, null] as const
            const data = snap.data() as Record<string, unknown>
            const profile: UserProfile = {
              uid,
              displayName: typeof data.displayName === "string" ? data.displayName : null,
              email: typeof data.email === "string" ? data.email : null,
              photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
            }
            return [uid, profile] as const
          } catch {
            return [uid, null] as const
          }
        })
      )

      set((state) => ({
        profilesByUid: {
          ...state.profilesByUid,
          ...Object.fromEntries(results),
        },
      }))
    } finally {
      set((state) => ({
        isLoadingByUid: Object.fromEntries(
          Object.entries(state.isLoadingByUid).filter(([uid]) => !toFetch.includes(uid))
        ) as Record<string, boolean>,
      }))
    }
  },
}))
