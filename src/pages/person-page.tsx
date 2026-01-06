import { useEffect, useMemo } from "react"

import { useNavigate, useParams } from "@tanstack/react-router"
import { Heart, MessageCircle } from "lucide-react"

import { ConversationListing } from "@/components/conversation-listing"
import { InlineTooltip } from "@/components/ui/inline-tooltip"
import { useConversationStore } from "@/stores/conversations"
import { useUserProfilesStore } from "@/stores/user-profiles"

export function PersonPage() {
  const { uid } = useParams({ from: "/people/$uid" })
  const navigate = useNavigate()

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

  useEffect(() => {
    void loadProfiles([uid])
  }, [loadProfiles, uid])

  const profile = profilesByUid[uid]
  const displayName = profile?.displayName ?? "Anonymous Scholar"

  const conversations = useMemo(() => {
    const authored = savedConversations.filter((c) => c.authorUid === uid)
    authored.sort((a, b) => {
      const heartsA = typeof a.heartsCount === "number" ? a.heartsCount : 0
      const heartsB = typeof b.heartsCount === "number" ? b.heartsCount : 0
      if (heartsA !== heartsB) return heartsB - heartsA
      return String(b.createdAt).localeCompare(String(a.createdAt))
    })
    return authored
  }, [savedConversations, uid])

  const totalHearts = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (typeof c.heartsCount === "number" ? c.heartsCount : 0), 0)
  }, [conversations])

  return (
    <main className="flex-1 overflow-y-auto px-4 py-10 md:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {!hasLoaded || isLoading ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm text-zinc-500">
            Loading profile…
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center gap-4">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={displayName}
                    className="h-14 w-14 rounded-full"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-zinc-100" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-2xl font-semibold text-zinc-900">{displayName}</div>
                </div>

                <div className="flex items-center gap-4 text-sm text-zinc-700">
                  <InlineTooltip label={`${totalHearts} hearts`} placement="bottom" tone="rose">
                    <span className="inline-flex items-center gap-1" aria-label={`${totalHearts} hearts`}>
                      <Heart className="h-4 w-4 text-rose-600" />
                      <span className="tabular-nums font-semibold text-zinc-900">{totalHearts}</span>
                    </span>
                  </InlineTooltip>
                  <InlineTooltip
                    label={`${conversations.length} conversations`}
                    placement="bottom"
                    tone="blue"
                  >
                    <span
                      className="inline-flex items-center gap-1"
                      aria-label={`${conversations.length} conversations`}
                    >
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                      <span className="tabular-nums font-semibold text-zinc-900">{conversations.length}</span>
                    </span>
                  </InlineTooltip>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {conversations.length === 0 ? (
                <div className="rounded-3xl bg-white p-10 text-center text-sm text-zinc-500">
                  No conversations yet.
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {conversations.map((conversation) => (
                    <ConversationListing
                      key={conversation.id}
                      conversation={conversation}
                      showAuthor={false}
                      onClick={() => {
                        void navigate({ to: "/conversations/$id", params: { id: String(conversation.id) } })
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
