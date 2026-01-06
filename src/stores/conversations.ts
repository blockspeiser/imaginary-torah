import { create } from "zustand"
import {
  Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"

import type { SefariaTextResponse } from "@/components/source-block"
import { auth, db } from "@/firebase"

export type ChatRole = "user" | "agent"

export type ChatMessageSnapshot =
  | { id: string; type: "chat"; role: ChatRole; content: string }
  | { id: string; type: "source" }

export type LearnerTypeOption =
  | "Just Jewish"
  | "Orthodox"
  | "Conservative"
  | "Reform"
  | "Reconstructionist"
  | "Secular"
  | "Academic"
  | "Conversion Student"
  | "Christian"
  | "Not Jewish"

export type SourcesAllowedMode = "primary_torah_only" | "non_torah_allowed"

export type NonTorahSourceType =
  | "source_sheets"
  | "academic_sources"
  | "non_jewish_religious_sources"
  | "literary_sources"
  | "pop_culture_sources"

export type SourcesAllowed = {
  mode: SourcesAllowedMode
  nonTorahSources: NonTorahSourceType[]
}

export type HebrewKnowledgeOption =
  | "Can read and understand Hebrew"
  | "Can read Hebrew and knows some words"
  | "Can read Hebrew but don't know many words"
  | "Can't read Hebrew but knows some words"
  | "No Hebrew knowledge"

export type LearnerAgeOption =
  | "Adult"
  | "High School"
  | "Grade School"
  | "Children"

export const LEARNER_TYPE_OPTIONS: LearnerTypeOption[] = [
  "Just Jewish",
  "Orthodox",
  "Conservative",
  "Reform",
  "Reconstructionist",
  "Secular",
  "Academic",
  "Conversion Student",
  "Christian",
  "Not Jewish",
]

export const SOURCES_ALLOWED_MODE_OPTIONS: { value: SourcesAllowedMode; label: string }[] = [
  { value: "primary_torah_only", label: "Primary Torah sources only" },
  { value: "non_torah_allowed", label: "Non Torah sources allowed" },
]

export const NON_TORAH_SOURCE_TYPE_OPTIONS: { value: NonTorahSourceType; label: string }[] = [
  { value: "source_sheets", label: "Source Sheets" },
  { value: "academic_sources", label: "Academic sources" },
  { value: "non_jewish_religious_sources", label: "Non Jewish religious sources" },
  { value: "literary_sources", label: "Literary sources" },
  { value: "pop_culture_sources", label: "Pop culture sources" },
]

export function formatSourcesAllowed(sourcesAllowed: SourcesAllowed): string {
  if (sourcesAllowed.mode === "primary_torah_only") return "Primary Torah sources only"
  if (sourcesAllowed.nonTorahSources.length === 0) return "Non Torah sources allowed"

  const labels = new Map(
    NON_TORAH_SOURCE_TYPE_OPTIONS.map((opt) => [opt.value, opt.label] as const)
  )
  return `Non Torah sources allowed: ${sourcesAllowed.nonTorahSources
    .map((t) => labels.get(t) ?? t)
    .join(", ")}`
}

export const HEBREW_KNOWLEDGE_OPTIONS: HebrewKnowledgeOption[] = [
  "Can read and understand Hebrew",
  "Can read Hebrew and knows some words",
  "Can read Hebrew but don't know many words",
  "Can't read Hebrew but knows some words",
  "No Hebrew knowledge",
]

export const LEARNER_AGE_OPTIONS: LearnerAgeOption[] = [
  "Adult",
  "High School",
  "Grade School",
  "Children",
]

export type ConversationTranscript = {
  messages: ChatMessageSnapshot[]
  sourcesById: Record<string, SefariaTextResponse>
}

export type ConversationAboutLearner = {
  age: LearnerAgeOption
  learnerType: LearnerTypeOption
  sourcesAllowed: SourcesAllowed
  hebrewKnowledge: HebrewKnowledgeOption
  description: string
  tags: string[]
}

export type SavedConversation = {
  id: number
  title: string
  createdAt: string
  updatedAt: string
  transcript: ConversationTranscript
  aboutLearner: ConversationAboutLearner
  authorUid: string
  heartsCount: number
  heartsByUid: Record<string, true>
}

export type SaveConversationPayload = {
  title: string
  transcript: ConversationTranscript
  aboutLearner: ConversationAboutLearner
}

type ConversationStore = {
  savedConversations: SavedConversation[]
  hasLoaded: boolean
  isLoading: boolean
  isHeartTogglingById: Record<number, boolean>
  loadConversations: () => Promise<void>
  saveConversation: (payload: SaveConversationPayload) => Promise<SavedConversation>
  updateConversationTranscript: (id: number, transcript: ConversationTranscript) => Promise<void>
  deleteConversation: (id: number) => Promise<void>
  toggleHeart: (id: number) => Promise<void>
}

function cloneTranscript(transcript: ConversationTranscript): ConversationTranscript {
  return {
    messages: transcript.messages.map((message) => ({ ...message })),
    sourcesById: JSON.parse(JSON.stringify(transcript.sourcesById)) as Record<
      string,
      SefariaTextResponse
    >,
  }
}

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []
  tags.forEach((raw) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    if (seen.has(lower)) return
    seen.add(lower)
    normalized.push(trimmed)
  })
  return normalized
}

function toIsoString(value: unknown): string {
  if (typeof value === "string" && value) return value
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value && typeof value === "object" && "toDate" in value) {
    const maybeToDate = (value as { toDate?: unknown }).toDate
    if (typeof maybeToDate === "function") {
      try {
        return (maybeToDate as () => Date)().toISOString()
      } catch {
        // fall through
      }
    }
  }
  return new Date().toISOString()
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  savedConversations: [],
  hasLoaded: false,
  isLoading: false,
  isHeartTogglingById: {},
  loadConversations: async () => {
    if (get().isLoading) return
    set({ isLoading: true })
    try {
      const q = query(collection(db, "conversations"), orderBy("id", "desc"))
      const snap = await getDocs(q)
      const conversations: SavedConversation[] = snap.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>
          const id = typeof data.id === "number" ? data.id : Number(d.id)
          const title = typeof data.title === "string" ? data.title : "Untitled"
          const transcript = (data.transcript as ConversationTranscript | undefined) ?? {
            messages: [],
            sourcesById: {},
          }
          const aboutLearner = data.aboutLearner as ConversationAboutLearner
          const authorUid = typeof data.authorUid === "string" ? data.authorUid : ""

          const heartsCountRaw = data.heartsCount
          const heartsCount =
            typeof heartsCountRaw === "number" && Number.isFinite(heartsCountRaw)
              ? heartsCountRaw
              : 0

          const heartsByUidRaw = data.heartsByUid
          const heartsByUid: Record<string, true> =
            heartsByUidRaw && typeof heartsByUidRaw === "object" && !Array.isArray(heartsByUidRaw)
              ? (Object.fromEntries(
                  Object.entries(heartsByUidRaw as Record<string, unknown>).filter(
                    ([, v]) => v === true
                  )
                ) as Record<string, true>)
              : {}

          return {
            id,
            title,
            createdAt: toIsoString(data.createdAt),
            updatedAt: toIsoString(data.updatedAt),
            transcript,
            aboutLearner,
            authorUid,
            heartsCount,
            heartsByUid,
          }
        })
        .filter((c) => Number.isFinite(c.id))
      set({ savedConversations: conversations, hasLoaded: true })
    } finally {
      set({ isLoading: false })
    }
  },
  saveConversation: async (payload) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("Anonymous auth not ready")
    }

    const nowIso = new Date().toISOString()
    let allocatedId = 0

    await runTransaction(db, async (tx) => {
      const counterRef = doc(db, "counters", "conversations")
      const counterSnap = await tx.get(counterRef)
      const nextIdRaw = counterSnap.exists() ? (counterSnap.data().nextId as unknown) : 1
      const nextId = typeof nextIdRaw === "number" && Number.isFinite(nextIdRaw) ? nextIdRaw : 1

      allocatedId = nextId

      if (!counterSnap.exists()) {
        tx.set(counterRef, { nextId: nextId + 1 })
      } else {
        tx.update(counterRef, { nextId: nextId + 1 })
      }

      const conversationRef = doc(db, "conversations", String(allocatedId))
      tx.set(conversationRef, {
        id: allocatedId,
        title: payload.title.trim(),
        transcript: cloneTranscript(payload.transcript),
        aboutLearner: {
          ...payload.aboutLearner,
          description: payload.aboutLearner.description.trim(),
          tags: normalizeTags(payload.aboutLearner.tags),
        },
        authorUid: currentUser.uid,
        heartsCount: 0,
        heartsByUid: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    const conversation: SavedConversation = {
      id: allocatedId,
      title: payload.title.trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
      transcript: cloneTranscript(payload.transcript),
      aboutLearner: {
        ...payload.aboutLearner,
        description: payload.aboutLearner.description.trim(),
        tags: normalizeTags(payload.aboutLearner.tags),
      },
      authorUid: currentUser.uid,
      heartsCount: 0,
      heartsByUid: {},
    }

    set((state) => ({
      savedConversations: [conversation, ...state.savedConversations.filter((c) => c.id !== conversation.id)],
    }))

    return conversation
  },
  updateConversationTranscript: async (id, transcript) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("Anonymous auth not ready")
    }

    const nowIso = new Date().toISOString()
    await updateDoc(doc(db, "conversations", String(id)), {
      transcript: cloneTranscript(transcript),
      updatedAt: serverTimestamp(),
    })

    set((state) => ({
      savedConversations: state.savedConversations.map((c) => {
        if (c.id !== id) return c
        return { ...c, transcript: cloneTranscript(transcript), updatedAt: nowIso }
      }),
    }))
  },
  deleteConversation: async (id) => {
    await deleteDoc(doc(db, "conversations", String(id)))
    set((state) => ({ savedConversations: state.savedConversations.filter((c) => c.id !== id) }))
  },
  toggleHeart: async (id) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("Anonymous auth not ready")
    }

    const uid = currentUser.uid
    const conversationRef = doc(db, "conversations", String(id))

    const state = get()
    if (state.isHeartTogglingById[id]) return

    const prevConversation = state.savedConversations.find((c) => c.id === id)
    if (!prevConversation) return

    const prevHeartsByUid = { ...(prevConversation.heartsByUid ?? {}) }
    const prevCount = typeof prevConversation.heartsCount === "number" ? prevConversation.heartsCount : 0

    const prevHearted = prevHeartsByUid[uid] === true
    const optimisticHearted = !prevHearted
    const optimisticCount = Math.max(0, prevCount + (optimisticHearted ? 1 : -1))

    set((s) => ({
      isHeartTogglingById: { ...s.isHeartTogglingById, [id]: true },
      savedConversations: s.savedConversations.map((c) => {
        if (c.id !== id) return c
        const nextHeartsByUid = { ...(c.heartsByUid ?? {}) }
        if (optimisticHearted) nextHeartsByUid[uid] = true
        else delete nextHeartsByUid[uid]
        return { ...c, heartsCount: optimisticCount, heartsByUid: nextHeartsByUid }
      }),
    }))

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(conversationRef)
        if (!snap.exists()) throw new Error("Conversation not found")

        const data = snap.data() as Record<string, unknown>
        const heartsCountRaw = data.heartsCount
        const heartsCount =
          typeof heartsCountRaw === "number" && Number.isFinite(heartsCountRaw) ? heartsCountRaw : 0

        const heartsByUidRaw = data.heartsByUid
        const heartsByUid =
          heartsByUidRaw && typeof heartsByUidRaw === "object" && !Array.isArray(heartsByUidRaw)
            ? (heartsByUidRaw as Record<string, unknown>)
            : {}

        const currentlyHearted = heartsByUid[uid] === true
        const nextHearted = !currentlyHearted
        const nextCount = Math.max(0, heartsCount + (nextHearted ? 1 : -1))

        tx.update(conversationRef, {
          [`heartsByUid.${uid}`]: nextHearted ? true : deleteField(),
          heartsCount: nextCount,
        })
      })
    } catch {
      set((s) => ({
        savedConversations: s.savedConversations.map((c) => {
          if (c.id !== id) return c
          return { ...c, heartsCount: prevCount, heartsByUid: prevHeartsByUid }
        }),
      }))
    } finally {
      set((s) => {
        const { [id]: _, ...rest } = s.isHeartTogglingById
        return { isHeartTogglingById: rest }
      })
    }
  },
}))
