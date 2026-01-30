import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { setOnUnauthorized } from "@/api/api"

const TOKEN_KEY = "trove_auth_token"
const EMAIL_KEY = "trove_auth_email"

interface AuthContextValue {
  isAuthenticated: boolean
  token: string | null
  email: string | null
  login: (token: string, email: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  )
  const [email, setEmail] = useState<string | null>(() =>
    localStorage.getItem(EMAIL_KEY)
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EMAIL_KEY)
    setToken(null)
    setEmail(null)
  }, [])

  const login = useCallback((newToken: string, newEmail: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(EMAIL_KEY, newEmail)
    setToken(newToken)
    setEmail(newEmail)
  }, [])

  useEffect(() => {
    setOnUnauthorized(logout)
  }, [logout])

  const value = useMemo(
    () => ({
      isAuthenticated: token !== null,
      token,
      email,
      login,
      logout,
    }),
    [token, email, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
