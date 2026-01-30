import { Link } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { TroveFrameIcon } from "@/components/trove-logo"

export function HomePage() {
  const { isAuthenticated, email, logout } = useAuth()

  return (
    <div className="min-h-svh">
      <header className="border-border flex items-center justify-between border-b px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <TroveFrameIcon className="text-primary h-5" />
          <span className="font-serif text-lg tracking-tight">Trove</span>
        </Link>
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">{email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        )}
      </header>
      <main className="p-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Trove</h1>
        <p className="text-muted-foreground mt-2">
          Your personal collection manager.
        </p>
      </main>
    </div>
  )
}
