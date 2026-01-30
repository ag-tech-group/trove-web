import { act } from "@testing-library/react"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"

import { routeTree } from "@/routeTree.gen"
import { AuthProvider } from "@/lib/auth"

export async function renderRoute(route: string) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  })

  const memoryHistory = createMemoryHistory({ initialEntries: [route] })

  const testAuth = {
    isAuthenticated: true,
    token: "test-token",
    email: "test@example.com",
    login: () => {},
    logout: () => {},
  }

  const testRouter = createRouter({
    routeTree,
    history: memoryHistory,
    context: {
      queryClient: testQueryClient,
      auth: testAuth,
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  })

  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(
      <QueryClientProvider client={testQueryClient}>
        <AuthProvider>
          <RouterProvider router={testRouter} />
        </AuthProvider>
      </QueryClientProvider>
    )
  })

  const { rerender, ...rest } = result!

  return {
    ...rest,
    rerender: async () => {
      await act(async () => {
        rerender(
          <QueryClientProvider client={testQueryClient}>
            <AuthProvider>
              <RouterProvider router={testRouter} />
            </AuthProvider>
          </QueryClientProvider>
        )
      })
    },
    router: testRouter,
    queryClient: testQueryClient,
    history: memoryHistory,
  }
}
