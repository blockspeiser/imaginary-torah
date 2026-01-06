import { useEffect, useMemo } from "react"

import { PersonListing } from "@/components/person-listing"
import { useConversationStore } from "@/stores/conversations"
import { useUserProfilesStore } from "@/stores/user-profiles"
import { Link } from "@tanstack/react-router"
import { PenSquare } from "lucide-react"

type PersonStat = {
  uid: string
  heartsTotal: number
  conversationCount: number
}

export function PeoplePage() {
  const savedConversations = useConversationStore((state) => state.savedConversations)
  const hasLoaded = useConversationStore((state) => state.hasLoaded)
  const isLoading = useConversationStore((state) => state.isLoading)
  const loadConversations = useConversationStore((state) => state.loadConversations)

  const profilesByUid = useUserProfilesStore((s) => s.profilesByUid)
  const loadProfiles = useUserProfilesStore((s) => s.loadProfiles)

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      void loadConversations()
    }
  }, [hasLoaded, isLoading, loadConversations])

  const people = useMemo(() => {
    const statsByUid = new Map<string, PersonStat>()

    savedConversations.forEach((c) => {
      const uid = c.authorUid
      if (!uid) return

      const existing = statsByUid.get(uid) ?? { uid, heartsTotal: 0, conversationCount: 0 }
      existing.heartsTotal += typeof c.heartsCount === "number" ? c.heartsCount : 0
      existing.conversationCount += 1
      statsByUid.set(uid, existing)
    })

    const arr = Array.from(statsByUid.values())
    arr.sort((a, b) => {
      if (a.heartsTotal !== b.heartsTotal) return b.heartsTotal - a.heartsTotal
      if (a.conversationCount !== b.conversationCount) return b.conversationCount - a.conversationCount
      return a.uid.localeCompare(b.uid)
    })

    return arr
  }, [savedConversations])

  useEffect(() => {
    void loadProfiles(people.map((p) => p.uid))
  }, [loadProfiles, people])

  return (
    <main className="flex-1 overflow-y-auto px-4 py-10 md:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold text-zinc-900">Contributors</h1>
            <div className="mt-2 text-sm text-zinc-500">Ranked by total hearts across all conversations.</div>
          </div>

          <div className="shrink-0">
            <Link
              to="/create"
              style={{ backgroundColor: "var(--hot-pink)" }}
              className="no-underline inline-flex items-center justify-center rounded-xl px-5 py-3 text-lg font-semibold text-white transition hover:brightness-95 hover:no-underline active:brightness-90 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <PenSquare className="h-6 w-6 mr-2" />
              Start a Conversation
            </Link>
          </div>
        </div>

        {!hasLoaded || isLoading ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm text-zinc-500">
            Loading people…
          </div>
        ) : people.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm text-zinc-500">
            No one has created any conversations yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">

            <div className="mt-2 flex flex-col gap-2">
              {people.map((p) => {
                const profile = profilesByUid[p.uid]

                return (
                  <PersonListing
                    key={p.uid}
                    uid={p.uid}
                    profile={profile}
                    heartsTotal={p.heartsTotal}
                    conversationCount={p.conversationCount}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
