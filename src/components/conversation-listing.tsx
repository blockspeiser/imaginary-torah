import { useEffect, useMemo } from "react"

import { formatDistanceToNow } from "date-fns"

import { cn } from "@/lib/utils"
import { useUserProfilesStore } from "@/stores/user-profiles"
import { useAuthStore } from "@/stores/auth"
import {
  NON_TORAH_SOURCE_TYPE_OPTIONS,
  SOURCES_ALLOWED_MODE_OPTIONS,
  useConversationStore,
  type SavedConversation,
} from "@/stores/conversations"
import { Heart } from "lucide-react"
import { Link } from "@tanstack/react-router"

type ConversationListingProps = {
  conversation: SavedConversation
  onClick?: () => void
  className?: string
  showAuthor?: boolean
  interactive?: boolean
  showSummary?: boolean
}

export function ConversationListing({
  conversation,
  onClick,
  className,
  showAuthor = true,
  interactive = true,
  showSummary = true,
}: ConversationListingProps) {
  const { age, learnerType, sourcesAllowed, hebrewKnowledge, description, tags } =
    conversation.aboutLearner

  const toggleHeart = useConversationStore((state) => state.toggleHeart)
  const isHeartToggling = useConversationStore((state) => state.isHeartTogglingById[conversation.id] === true)
  const currentUid = useAuthStore((s) => s.user?.uid)
  const isHearted =
    !!currentUid && !!conversation.heartsByUid && conversation.heartsByUid[currentUid] === true

  const sourcesAllowedModeLabel =
    SOURCES_ALLOWED_MODE_OPTIONS.find((opt) => opt.value === sourcesAllowed.mode)?.label ??
    sourcesAllowed.mode

  const relativeDate = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })
    } catch {
      return conversation.createdAt
    }
  }, [conversation.createdAt])

  const profilesByUid = useUserProfilesStore((s) => s.profilesByUid)
  const loadProfiles = useUserProfilesStore((s) => s.loadProfiles)
  const authorUid = conversation.authorUid

  useEffect(() => {
    if (!showAuthor) return
    if (!authorUid) return
    void loadProfiles([authorUid])
  }, [authorUid, loadProfiles, showAuthor])

  const authorProfile = authorUid ? profilesByUid[authorUid] : null
  const authorName = authorProfile?.displayName ?? "Anonymous Scholar"

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (!onClick) return
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={cn(
        "w-full bg-transparent py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
        interactive && "cursor-pointer",
        className
      )}
    >
      <div className="">
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!currentUid) return
              if (isHeartToggling) return
              void toggleHeart(conversation.id)
            }}
            disabled={!currentUid || isHeartToggling}
            aria-label="Heart this conversation"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 mr-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-300",
              isHearted
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
              (!currentUid || isHeartToggling) && "opacity-50"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", isHearted && "fill-current")} />
            <span>{conversation.heartsCount ?? 0}</span>
          </button>

          <span className="text-2xl font-semibold text-zinc-600">{conversation.title}</span>
        </div>

      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
          {age}
        </span>
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
          {learnerType}
        </span>
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
          {sourcesAllowedModeLabel}
        </span>
        {sourcesAllowed.mode === "non_torah_allowed"
          ? sourcesAllowed.nonTorahSources.map((type) => (
              <span
                key={type}
                className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700"
              >
                {NON_TORAH_SOURCE_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ?? type}
              </span>
            ))
          : null}
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
          {hebrewKnowledge}
        </span>
      </div>

      <div className="my-3">
        {showAuthor && authorUid ? (
            <Link
              to="/people/$uid"
              params={{ uid: authorUid }}
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="text-md dark-pink mr-2"
            >
              {authorName}
            </Link>
        ) : null}
        <span className="text-sm tracking-wide text-zinc-400">{relativeDate}</span>
      </div>

      {showSummary ? (
        <>
          {description ? (
            <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              {description}
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
