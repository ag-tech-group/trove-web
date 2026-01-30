import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth"
import {
  useAuthJwtLoginAuthJwtLoginPost,
  useRegisterRegisterAuthRegisterPost,
} from "@/api/generated/hooks/auth/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

async function extractErrorMessage(err: unknown, fallback: string) {
  try {
    const response = (err as { response?: Response })?.response
    if (!response) return fallback

    const body = await response.clone().json()
    const detail = body?.detail

    if (typeof detail === "string") return detail
    // ValidationError[] from 422 responses
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((e: { msg: string }) => e.msg).join(". ")
    }
    // {[key: string]: string} from ErrorModel
    if (typeof detail === "object" && detail !== null) {
      return Object.values(detail).join(". ")
    }
  } catch {
    // Fall through to fallback
  }
  return fallback
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleLogin = (token: string) => {
    login(token, email)
    navigate({ to: "/" })
  }

  const loginMutation = useAuthJwtLoginAuthJwtLoginPost({
    mutation: {
      onSuccess: (response) => {
        // orvalClient returns the raw JSON body; onSuccess only fires for 2xx
        handleLogin(
          (response as unknown as { access_token: string }).access_token
        )
      },
      onError: async (err) => {
        setError(await extractErrorMessage(err, "Invalid email or password."))
      },
    },
  })

  const registerMutation = useRegisterRegisterAuthRegisterPost({
    mutation: {
      onSuccess: () => {
        // Registration succeeded — sign them in automatically
        loginMutation.mutate({
          data: { username: email, password },
        })
      },
      onError: async (err) => {
        setError(await extractErrorMessage(err, "Registration failed."))
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
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-1 pb-2">
          <img src="/trove.svg" alt="" className="size-12" />
          <h1 className="text-3xl tracking-tight">Trove</h1>
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
              <Input
                id="password"
                type="password"
                required
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {mode === "signup" && (
              <div className="grid gap-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
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
        </CardContent>
      </Card>
    </div>
  )
}
