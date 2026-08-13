import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { toast } from "sonner"
import { ErrorBoundary } from "./components/error-boundary"
import { NotFound } from "./components/not-found"
import { ThemeProvider } from "./components/theme-provider"
import "./index.css"
import { getErrorMessage } from "./lib/api-errors"
import { AuthProvider, useAuth } from "./lib/auth"
import {
  initErrorMonitoring,
  setErrorMonitoringUser,
} from "./lib/error-monitoring"
import { routeTree } from "./routeTree.gen"

void initErrorMonitoring()

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
  defaultNotFoundComponent: NotFound,
  defaultErrorComponent: ErrorBoundary,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      skipGlobalError?: boolean
    }
  }
}

function App() {
  const auth = useAuth()

  useEffect(() => {
    if (auth.isAuthenticated && auth.userId && auth.email) {
      setErrorMonitoringUser({ id: auth.userId, email: auth.email })
    } else {
      setErrorMonitoringUser(null)
    }
  }, [auth.isAuthenticated, auth.userId, auth.email])

  if (auth.isLoading) return null
  return <RouterProvider router={router} context={{ auth }} />
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="trove_theme">
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
