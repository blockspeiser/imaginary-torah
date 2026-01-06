import { useEffect, useMemo, useState } from "react"

import { ConversationListing } from "@/components/conversation-listing"
import {
  HEBREW_KNOWLEDGE_OPTIONS,
  LEARNER_AGE_OPTIONS,
  LEARNER_TYPE_OPTIONS,
  SOURCES_ALLOWED_MODE_OPTIONS,
  useConversationStore,
  type HebrewKnowledgeOption,
  type LearnerAgeOption,
  type LearnerTypeOption,
  type SourcesAllowedMode,
} from "@/stores/conversations"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useAuthStore } from "@/stores/auth"
import { Heart, Search } from "lucide-react"

export function ExplorePage() {
  // Store + router
  const savedConversations = useConversationStore((state) => state.savedConversations)
  const hasLoaded = useConversationStore((state) => state.hasLoaded)
  const isLoading = useConversationStore((state) => state.isLoading)
  const loadConversations = useConversationStore((state) => state.loadConversations)
  const navigate = useNavigate()
  const search = useSearch({ from: "/explore" }) as { mine?: string }
  const uid = useAuthStore((s) => s.user?.uid)

  // UI state
  const [sort, setSort] = useState<"hearts" | "recent">("hearts")

  const [draftQuery, setDraftQuery] = useState("")
  const [query, setQuery] = useState("")
  const [learnerType, setLearnerType] = useState<"all" | LearnerTypeOption>("all")
  const [hebrewKnowledge, setHebrewKnowledge] = useState<"all" | HebrewKnowledgeOption>("all")
  const [sourceType, setSourceType] = useState<"all" | SourcesAllowedMode>("all")
  const [age, setAge] = useState<"all" | LearnerAgeOption>("all")

  const viewKey = useMemo(() => {
    return JSON.stringify({
      mine: search?.mine ?? "",
      uid: uid ?? "",
      sort,
      query: query.trim().toLowerCase(),
      learnerType,
      hebrewKnowledge,
      sourceType,
      age,
    })
  }, [age, hebrewKnowledge, learnerType, query, search?.mine, sort, sourceType, uid])

  const [stableOrderedIds, setStableOrderedIds] = useState<number[]>([])

  // Filtering
  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase()
    const mineOnly = search?.mine === "1"

    return savedConversations.filter((conversation) => {
      const about = conversation.aboutLearner

      if (mineOnly && uid && conversation.authorUid !== uid) return false

      if (mineOnly && !uid) return false

      if (learnerType !== "all" && about.learnerType !== learnerType) return false
      if (hebrewKnowledge !== "all" && about.hebrewKnowledge !== hebrewKnowledge) return false
      if (sourceType !== "all" && about.sourcesAllowed.mode !== sourceType) return false
      if (age !== "all" && about.age !== age) return false

      if (!q) return true

      const title = conversation.title ?? ""
      const description = about.description ?? ""
      const tags = Array.isArray(about.tags) ? about.tags.join(" ") : ""

      const haystack = `${title} ${description} ${tags}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [age, hebrewKnowledge, learnerType, query, savedConversations, search?.mine, sourceType, uid])

  // Sorting
  const filteredAndSortedConversations = useMemo(() => {
    const arr = [...filteredConversations]
    arr.sort((a, b) => {
      if (sort === "recent") {
        return String(b.createdAt).localeCompare(String(a.createdAt))
      }
      const heartsA = typeof a.heartsCount === "number" ? a.heartsCount : 0
      const heartsB = typeof b.heartsCount === "number" ? b.heartsCount : 0
      if (heartsA !== heartsB) return heartsB - heartsA
      return String(b.createdAt).localeCompare(String(a.createdAt))
    })
    return arr
  }, [filteredConversations, sort])

  useEffect(() => {
    if (!hasLoaded) return
    setStableOrderedIds(filteredAndSortedConversations.map((c) => c.id))
  }, [hasLoaded, viewKey])

  const renderedConversations = useMemo(() => {
    const byId = new Map<number, (typeof filteredAndSortedConversations)[number]>()
    filteredAndSortedConversations.forEach((c) => byId.set(c.id, c))

    const rendered: (typeof filteredAndSortedConversations)[number][] = []
    stableOrderedIds.forEach((id) => {
      const c = byId.get(id)
      if (c) rendered.push(c)
    })

    const stableSet = new Set(stableOrderedIds)
    filteredAndSortedConversations.forEach((c) => {
      if (!stableSet.has(c.id)) rendered.push(c)
    })

    return rendered
  }, [filteredAndSortedConversations, stableOrderedIds])

  // Derived counts
  const savedCount = savedConversations.length
  const filteredCount = filteredAndSortedConversations.length

  // Initial load
  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      void loadConversations()
    }
  }, [hasLoaded, isLoading, loadConversations])

  return (
    <main className="flex-1 overflow-y-auto px-4 pt-8 pb-2">
      <div className="w-full p-4">
        {/* Search + filters */}
        <div className="search-controls pb-2 mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setQuery(draftQuery)
            }}
          >
            <div className="relative">
              <input
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder="Search Conversations"
                className="block w-full rounded-3xl border border-zinc-500 bg-white pl-6 pr-16 py-4 text-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label="Search conversations"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <Search className="h-6 w-6" />
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-start gap-2">
            <Select value={learnerType} onValueChange={(v) => setLearnerType(v as typeof learnerType)}>
              <SelectTrigger
                aria-label="Filter by point of view"
                className="h-10 w-auto rounded-full border-blue-100 bg-blue-50 px-4 text-sm text-blue-900 hover:bg-blue-100"
              >
                <SelectValue placeholder="All points of view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All points of view</SelectItem>
                {LEARNER_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={hebrewKnowledge} onValueChange={(v) => setHebrewKnowledge(v as typeof hebrewKnowledge)}>
              <SelectTrigger
                aria-label="Filter by Hebrew knowledge"
                className="h-10 w-auto rounded-full border-blue-100 bg-blue-50 px-4 text-sm text-blue-900 hover:bg-blue-100"
              >
                <SelectValue placeholder="All Hebrew knowledge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hebrew knowledge</SelectItem>
                {HEBREW_KNOWLEDGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceType} onValueChange={(v) => setSourceType(v as typeof sourceType)}>
              <SelectTrigger
                aria-label="Filter by source types"
                className="h-10 w-auto rounded-full border-blue-100 bg-blue-50 px-4 text-sm text-blue-900 hover:bg-blue-100"
              >
                <SelectValue placeholder="All source types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All source types</SelectItem>
                {SOURCES_ALLOWED_MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={age} onValueChange={(v) => setAge(v as typeof age)}>
              <SelectTrigger
                aria-label="Filter by age"
                className="h-10 w-auto rounded-full border-blue-100 bg-blue-50 px-4 text-sm text-blue-900 hover:bg-blue-100"
              >
                <SelectValue placeholder="All ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ages</SelectItem>
                {LEARNER_AGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-hot-pink bg-light-pink px-4 py-3 text-sm text-zinc-700">
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled
              aria-hidden="true"
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-700"
            >
              <Heart className="h-5 w-5 fill-current" />
            </button>
            <div className="text-lg min-w-0">
              Help us learn by clicking the heart button on conversations you like.
            </div>
          </div>
        </div>

        {hasLoaded && !isLoading && savedCount > 0 ? (
          <div className=" mt-2 flex items-center justify-between gap-3 text-sm text-zinc-500">
            <div>{filteredCount} conversations</div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Sort:</span>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger
                  aria-label="Sort conversations"
                  className="h-8 w-auto rounded-full border-blue-100 bg-blue-50 px-3 text-xs text-blue-900 hover:bg-blue-100"
                >
                  <SelectValue placeholder="Hearts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hearts">Hearts</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {/* Loading, empty, or no results */}
        {!hasLoaded || isLoading ? (
          <div className="mt-8 rounded-3xl p-10 text-center text-sm text-zinc-500">
            Loading conversations…
          </div>
        ) : savedCount === 0 ? (
          <div className="mt-8 rounded-3xl p-10 text-center text-sm text-zinc-500">
            You haven't saved any conversations yet. Create one on the Create tab and hit "Save
            conversation" when you're ready to share it.
          </div>
        ) : filteredCount === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center text-sm text-zinc-500">
            No conversations match your search and filters.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {renderedConversations.map((conversation) => (
              <ConversationListing
                key={conversation.id}
                conversation={conversation}
                onClick={() =>
                  navigate({ to: "/conversations/$id", params: { id: String(conversation.id) } })
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
