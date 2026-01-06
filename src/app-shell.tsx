import { useEffect, useState, type ReactNode } from "react"

import { Compass, Info, Menu, PenSquare, Users, type LucideIcon } from "lucide-react"
import { Link, useLocation } from "@tanstack/react-router"

import { DesktopRailNav } from "@/components/desktop-railnav"
import { MobileNavDrawer } from "@/components/mobile-nav-drawer"
import { PostSaveLoginModal } from "@/components/post-save-login-modal"
import { useAuthStore } from "@/stores/auth"
import { useConversationStore } from "@/stores/conversations"
import { useHeaderActionsStore } from "@/stores/header-actions"

type NavItem = {
  to: "/" | "/create" | "/explore" | "/people"
  label: string
  Icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: "/", label: "About", Icon: Info },
  { to: "/create", label: "Create", Icon: PenSquare },
  { to: "/explore", label: "Explore", Icon: Compass },
  { to: "/people", label: "People", Icon: Users },
]

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const isAuthReady = useAuthStore((s) => s.isReady)
  const logoutToAnonymous = useAuthStore((s) => s.logoutToAnonymous)
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt)

  const savedConversations = useConversationStore((s) => s.savedConversations)
  const showAnonymousProfileLink =
    !!user?.isAnonymous && !!user?.uid && savedConversations.some((c) => c.authorUid === user.uid)

  const headerDesktopRight = useHeaderActionsStore((s) => s.desktopRight)
  const headerMobileRight = useHeaderActionsStore((s) => s.mobileRight)

  useEffect(() => {
    requestAnimationFrame(() => {
      const main = document.querySelector("main") as HTMLElement | null
      if (main && typeof main.scrollTo === "function") {
        main.scrollTo({ top: 0, left: 0, behavior: "auto" })
        return
      }
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    })
  }, [location.pathname])

  return (
    <div className="min-h-svh bg-zinc-100 text-zinc-900">
      <div className="flex min-h-svh">
        {/* Desktop railnav */}
        <DesktopRailNav
          navItems={navItems}
          pathname={location.pathname}
          user={user}
          isAuthReady={isAuthReady}
          showAnonymousProfileLink={showAnonymousProfileLink}
          onLogin={openLoginPrompt}
          onLogout={() => {
            void logoutToAnonymous()
          }}
        />

        {/* Mobile nav drawer */}
        <MobileNavDrawer
          open={mobileNavOpen}
          pathname={location.pathname}
          navItems={navItems}
          user={user}
          onClose={() => setMobileNavOpen(false)}
          onLogin={openLoginPrompt}
          onLogout={() => {
            void logoutToAnonymous()
          }}
        />

        {/* Main content */}
        <div className="flex min-w-0 flex-1 justify-center md:pl-28">
          <div className="flex min-h-svh w-full max-w-[900px] flex-col bg-white">
            {/* Mobile header */}
            <header className="sticky top-0 z-40 border-b border-zinc-200 bg-red-100 p-4 md:static">
              {/* Mobile */}
              {headerMobileRight ? (
                <div className="flex items-center justify-between gap-3 md:hidden">
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-md text-zinc-700 transition hover:bg-zinc-100 active:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      onClick={() => setMobileNavOpen(true)}
                      aria-label="Open navigation"
                    >
                      <Menu className="h-7 w-7" />
                    </button>
                  </div>
                  <div className="flex items-center justify-end">{headerMobileRight}</div>
                </div>
              ) : (
                <div className="grid grid-cols-[48px_1fr_48px] items-center gap-3 md:hidden">
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-md text-zinc-700 transition hover:bg-zinc-100 active:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      onClick={() => setMobileNavOpen(true)}
                      aria-label="Open navigation"
                    >
                      <Menu className="h-7 w-7" />
                    </button>
                  </div>
                  <div className="min-w-0 text-center text-lg font-semibold text-zinc-700">
                    What does the perfect Torah conversation with AI look like?
                  </div>
                  <div className="flex items-center justify-end">
                    <Link
                      to="/create"
                      aria-label="Create"
                      style={{ backgroundColor: "var(--hot-pink)" }}
                      className="no-underline inline-flex h-12 w-12 items-center justify-center rounded-md text-white transition hover:brightness-95 hover:no-underline active:brightness-90 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <PenSquare className="h-7 w-7" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Desktop */}
              {headerDesktopRight ? (
                <div className="hidden md:flex items-center justify-between gap-4">
                  <div className="min-w-0 text-left text-lg font-semibold text-zinc-700">
                    What does the perfect Torah conversation with AI look like?
                  </div>
                  <div className="shrink-0">{headerDesktopRight}</div>
                </div>
              ) : (
                <div className="hidden md:flex items-center justify-center">
                  <div className="min-w-0 text-center text-lg font-semibold text-zinc-700">
                    What does the perfect Torah conversation with AI look like?
                  </div>
                </div>
              )}
            </header>

            {/* Routed page */}
            {children}

            {/* Modals */}
            <PostSaveLoginModal />
          </div>
        </div>
      </div>
    </div>
  )
}
