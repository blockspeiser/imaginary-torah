import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { getAnonymousAvatarDataUrl } from "@/lib/anon-avatar"
import { Link } from "@tanstack/react-router"

import { LogIn, LogOut, MessageSquareText } from "lucide-react"

export type MobileNavItem = {
  to: "/" | "/create" | "/explore" | "/people"
  label: string
  Icon: LucideIcon
}

export type MobileAuthUser = {
  uid: string
  isAnonymous: boolean
  displayName: string | null
  email: string | null
  photoURL: string | null
}

type Props = {
  open: boolean
  pathname: string
  navItems: MobileNavItem[]
  user: MobileAuthUser | null
  onClose: () => void
  onLogin: () => void
  onLogout: () => void
}

export function MobileNavDrawer({ open, pathname, navItems, user, onClose, onLogin, onLogout }: Props) {
  const avatarSrc =
    user && user.photoURL
      ? user.photoURL
      : user && user.isAnonymous
        ? getAnonymousAvatarDataUrl(user.uid)
        : null

  return (
    <div className={cn("fixed inset-0 z-50 md:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
      {/* Backdrop */}
      <button
        type="button"
        className={cn("absolute inset-0 bg-black/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
        aria-label="Close navigation"
      />

      {/* Drawer */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-72 bg-white transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-4">
          <img src="/logo.png" className="h-12 w-12 mb-4 rounded-md" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-2">
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
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"
                )}
                onClick={onClose}
              >
                <Icon className="h-5 w-5" />
                <span className="text-md">{label}</span>
              </Link>
            )
          })}

          {/* Account */}
          {user ? (
            <div className="mt-2 border-t border-zinc-200 pt-2">
              {user.isAnonymous ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onLogin()
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <LogIn className="h-5 w-5 text-zinc-500" />
                  <span className="text-md">Login with Google</span>
                </button>
              ) : (
                <>
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={user.displayName ?? "User"} className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-zinc-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-zinc-900">
                          {user.email ?? user.displayName ?? "Account"}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <Link
                to="/explore"
                search={{ mine: "1" } as never}
                onClick={onClose}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <MessageSquareText className="h-5 w-5 text-zinc-500" />
                <span className="text-md">Conversations</span>
              </Link>
              {!user.isAnonymous ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onLogout()
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <LogOut className="h-5 w-5 text-zinc-500" />
                  <span className="text-md">Log out</span>
                </button>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 border-t border-zinc-200 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onLogin()
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <LogIn className="h-5 w-5 text-zinc-500" />
                <span className="text-md">Login with Google</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  )
}
