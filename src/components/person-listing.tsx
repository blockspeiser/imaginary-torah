import { Link } from "@tanstack/react-router"
import { Heart, MessageCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { getAnonymousAvatarDataUrl } from "@/lib/anon-avatar"
import { InlineTooltip } from "@/components/ui/inline-tooltip"
import type { UserProfile } from "@/stores/user-profiles"

type PersonListingProps = {
  uid: string
  profile: UserProfile | null | undefined
  heartsTotal: number
  conversationCount: number
  className?: string
}

export function PersonListing({
  uid,
  profile,
  heartsTotal,
  conversationCount,
  className,
}: PersonListingProps) {
  const displayName = profile?.displayName ?? "Anonymous Scholar"
  const avatarSrc = profile?.photoURL ?? getAnonymousAvatarDataUrl(uid)

  return (
    <Link
      to="/people/$uid"
      params={{ uid }}
      className={cn(
        "mb-6 flex items-center gap-4 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:rounded-md",
        className
      )}
    >
      <img src={avatarSrc} alt={displayName} className="h-10 w-10 rounded-full" />

      <div className="min-w-0 flex-1">
        <div className="text-xl font-semibold">{displayName}</div>
      </div>

      <div className="flex shrink-0 items-center gap-4 text-sm text-zinc-700">
        <InlineTooltip label={`${heartsTotal} hearts`} placement="bottom" tone="rose">
          <span className="inline-flex items-center gap-1" aria-label={`${heartsTotal} hearts`}>
            <Heart className="h-4 w-4 text-rose-600" />
            <span className="tabular-nums font-semibold text-zinc-900">{heartsTotal}</span>
          </span>
        </InlineTooltip>
        <InlineTooltip
          label={`${conversationCount} conversations`}
          placement="bottom"
          tone="blue"
        >
          <span
            className="inline-flex items-center gap-1"
            aria-label={`${conversationCount} conversations`}
          >
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <span className="tabular-nums font-semibold text-zinc-900">{conversationCount}</span>
          </span>
        </InlineTooltip>
      </div>
    </Link>
  )
}
