import { Link } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { TroveFrameIcon } from "@/components/trove-logo"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppHeader() {
  const { email, logout } = useAuth()

  return (
    <header className="border-border flex items-center justify-between border-b px-6 py-3">
      <Link to="/" className="flex items-center gap-2">
        <TroveFrameIcon className="text-primary h-5" />
        <span className="font-serif text-lg tracking-tight">Trove</span>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {email}
        </span>
        <Button variant="ghost" size="sm" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
