import { Link } from "@tanstack/react-router"
import { TroveFrameIcon } from "@/components/trove-logo"

export function Footer() {
  return (
    <footer className="border-border border-t px-6 py-4">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <Link to="/" className="flex items-center gap-2">
          <TroveFrameIcon className="text-primary h-4" />
          <span className="font-serif text-sm tracking-tight">Trove</span>
        </Link>
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <Link
            to="/privacy-policy"
            className="underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          <span>&copy; {new Date().getFullYear()} Trove</span>
        </div>
      </div>
    </footer>
  )
}
