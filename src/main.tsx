import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { toast } from "sonner"
import "./index.css"
import { routeTree } from "./routeTree.gen"
import { AuthProvider, useAuth } from "./lib/auth"
import { getErrorMessage } from "./lib/api-errors"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: async (error, _variables, _context, mutation) => {
      if (mutation.meta?.skipGlobalError) return
      const message = await getErrorMessage(error)
      toast.error(message)
    },
  }),
})

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

function App() {
  const auth = useAuth()
  if (auth.isLoading) return null
  return <RouterProvider router={router} context={{ auth }} />
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
