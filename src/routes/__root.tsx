import { lazy, Suspense } from "react"
import { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-router-devtools").then((mod) => ({
        default: mod.TanStackRouterDevtools,
      }))
    )

const ReactQueryDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-query-devtools").then((mod) => ({
        default: mod.ReactQueryDevtools,
      }))
    )

interface RouterContext {
  queryClient: QueryClient
  auth: {
    isAuthenticated: boolean
    token: string | null
    email: string | null
    login: (token: string, email: string) => void
    logout: () => void
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <Suspense fallback={null}>
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </Suspense>
    </>
  )
}
