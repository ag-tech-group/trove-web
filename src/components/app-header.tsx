import { Link } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { TroveFrameIcon } from "@/components/trove-logo"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppHeader() {
  const { isAuthenticated, email, logout } = useAuth()

  return (
    <header className="border-border flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <TroveFrameIcon className="text-primary h-5" />
          <span className="font-serif text-lg tracking-tight">Trove</span>
        </Link>
        {isAuthenticated && (
          <Link
            to="/items"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            All Items
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {isAuthenticated ? (
          <>
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
