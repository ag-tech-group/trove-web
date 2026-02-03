import { useState } from "react"
import { Link, useNavigate, useSearch } from "@tanstack/react-router"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { getErrorMessage } from "@/lib/api-errors"
import { baseUrl } from "@/api/api"
import {
  useAuthJwtLoginAuthJwtLoginPost,
  useRegisterRegisterAuthRegisterPost,
} from "@/api/generated/hooks/auth/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TroveLogo } from "@/components/trove-logo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppLayout } from "@/components/app-layout"

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "Google sign-in was cancelled.",
  oauth_failed: "Google sign-in failed. Please try again.",
  oauth_not_configured: "Google sign-in is not configured.",
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { error: oauthError } = useSearch({ from: "/login" })
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(
    oauthError ? (OAUTH_ERROR_MESSAGES[oauthError] ?? "Sign-in failed.") : null
  )

  const handleLogin = () => {
    login(email)
    navigate({ to: "/" })
  }

  const loginMutation = useAuthJwtLoginAuthJwtLoginPost({
    mutation: {
      meta: { skipGlobalError: true },
      onSuccess: () => {
        handleLogin()
      },
      onError: async (err) => {
        setError(await getErrorMessage(err, "Invalid email or password."))
      },
    },
  })

  const registerMutation = useRegisterRegisterAuthRegisterPost({
    mutation: {
      meta: { skipGlobalError: true },
      onSuccess: () => {
        // Registration succeeded — sign them in automatically
        loginMutation.mutate({
          data: { username: email, password },
        })
      },
      onError: async (err) => {
        setError(await getErrorMessage(err, "Registration failed."))
      },
    },
  })

  const isPending = loginMutation.isPending || registerMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === "signin") {
      loginMutation.mutate({ data: { username: email, password } })
    } else {
      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
      registerMutation.mutate({ data: { email, password } })
    }
  }

  const toggleMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"))
    setConfirmPassword("")
    setError(null)
  }

  return (
    <AppLayout className="flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center pb-2">
          <TroveLogo layout="vertical" />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {mode === "signup" && (
              <div className="grid gap-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    tabIndex={-1}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending
                ? mode === "signin"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </Button>
            {error && (
              <p className="text-destructive-foreground text-center text-sm">
                {error}
              </p>
            )}
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              window.location.href = `${baseUrl}/auth/google/authorize`
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            {mode === "signin"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            <Link
              to="/privacy-policy"
              className="underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
