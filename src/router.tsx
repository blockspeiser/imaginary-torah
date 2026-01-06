import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router"

import App from "@/App"
import { AboutPage } from "@/pages/about-page"
import { AvatarsPage } from "@/pages/avatars-page"
import { ConversationPage } from "@/pages/conversation-page"
import { CreatePage } from "@/pages/create-page"
import { ExplorePage } from "@/pages/explore-page"
import { PeoplePage } from "@/pages/people-page"
import { PersonPage } from "@/pages/person-page"

const rootRoute = createRootRoute({
  component: App,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: AboutPage,
})

const createRoutePage = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  component: CreatePage,
})

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  component: ExplorePage,
})

const avatarsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/avatars",
  component: AvatarsPage,
})

const conversationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/conversations/$id",
  component: ConversationPage,
})

const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  component: PeoplePage,
})

const personRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people/$uid",
  component: PersonPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  createRoutePage,
  exploreRoute,
  avatarsRoute,
  conversationRoute,
  peopleRoute,
  personRoute,
])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
