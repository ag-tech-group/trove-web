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
        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          <Link
            to="/privacy-policy"
            className="underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms-of-use"
            className="underline-offset-4 hover:underline"
          >
            Terms of Use
          </Link>
          <span>&copy; {new Date().getFullYear()} AG Technology Group LLC</span>
        </div>
      </div>
    </footer>
  )
}
