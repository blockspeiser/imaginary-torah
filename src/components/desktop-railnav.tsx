import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { getAnonymousAvatarDataUrl } from "@/lib/anon-avatar"
import { Link } from "@tanstack/react-router"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LogIn, LogOut, MessageSquareText } from "lucide-react"

export type RailNavItem = {
  to: "/" | "/create" | "/explore" | "/people"
  label: string
  Icon: LucideIcon
}

export type RailAuthUser = {
  uid: string
  isAnonymous: boolean
  displayName: string | null
  email: string | null
  photoURL: string | null
}

type Props = {
  navItems: RailNavItem[]
  pathname: string
  user: RailAuthUser | null
  isAuthReady: boolean
  showAnonymousProfileLink: boolean
  onLogin: () => void
  onLogout: () => void
}

export function DesktopRailNav({
  navItems,
  pathname,
  user,
  isAuthReady,
  showAnonymousProfileLink,
  onLogin,
  onLogout,
}: Props) {
  const avatarSrc =
    user && user.photoURL
      ? user.photoURL
      : user && user.isAnonymous
        ? getAnonymousAvatarDataUrl(user.uid)
        : null

  const isAuthenticatedNonAnonymous = !!user && !user.isAnonymous

  return (
    <aside className="hidden h-svh w-28 shrink-0 flex-col items-center overflow-hidden border-r border-zinc-200 bg-white py-4 md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex">
      {/* Brand */}
      <div className="flex flex-1 flex-col items-center">
        <img src="/logo.png" className="h-14 w-14 mb-4 rounded-md" />

        {/* Primary nav */}
        <div className="flex flex-1 flex-col items-center gap-2">
          {navItems.map(({ to, label, Icon }) => {
            const active =
              pathname === to ||
              (to === "/explore" && pathname.startsWith("/conversations/")) ||
              (to === "/people" && pathname.startsWith("/people"))

            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex w-24 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-sm font-medium transition-colors",
                  active ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Account controls */}
      <div className="flex shrink-0 flex-col items-center pt-3">
        {!isAuthReady ? (
          <button
            type="button"
            disabled
            aria-label="Loading account"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white p-2 opacity-60"
          >
            <div className="h-12 w-12 rounded-full bg-zinc-200" />
          </button>
        ) : isAuthenticatedNonAnonymous ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              to="/explore"
              search={{ mine: "1" } as never}
              className="flex w-24 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <MessageSquareText className="h-6 w-6" />
              <span className="text-sm">Profile</span>
            </Link>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex w-24 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-2 py-2 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  aria-label="Account menu"
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={user.displayName ?? "User"}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-zinc-200" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-56 border border-zinc-200 bg-white p-2">
                <div className="px-3 py-2">
                  <div className="truncate text-sm font-medium text-zinc-900">{user.displayName ?? "Account"}</div>
                  {user.email ? <div className="truncate text-xs text-zinc-500">{user.email}</div> : null}
                </div>
                {!user.isAnonymous ? (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <LogOut className="h-4 w-4 text-zinc-500" />
                    Log out
                  </button>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {user?.isAnonymous && showAnonymousProfileLink ? (
              <Link
                to="/explore"
                search={{ mine: "1" } as never}
                className="flex w-24 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <MessageSquareText className="h-6 w-6" />
                <span className="text-sm">Profile</span>
              </Link>
            ) : null}

            <button
              type="button"
              onClick={onLogin}
              className="flex w-24 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <LogIn className="h-6 w-6" />
              <span className="text-sm">Login</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
