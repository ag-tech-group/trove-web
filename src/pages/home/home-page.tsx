import { Link } from "@tanstack/react-router"
import { Boxes, Search, Tags } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { TroveFrameIcon, TroveLogo } from "@/components/trove-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Footer } from "@/components/footer"
import { CollectionsDashboard } from "@/pages/home/collections-dashboard"

export function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  if (isAuthenticated) return <CollectionsDashboard />

  return <LandingPage />
}

const features = [
  {
    icon: Boxes,
    title: "Organize",
    description:
      "Group your items into collections and keep everything neatly categorized.",
  },
  {
    icon: Tags,
    title: "Track",
    description:
      "Record condition, provenance, dimensions, and estimated value for every piece.",
  },
  {
    icon: Search,
    title: "Search",
    description:
      "Find any item instantly with full-text search and category filters.",
  },
]

function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border flex items-center justify-between border-b px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <TroveFrameIcon className="text-primary h-5" />
          <span className="font-serif text-lg tracking-tight">Trove</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
          <TroveLogo layout="vertical" showTagline />
          <h1 className="max-w-lg text-3xl font-bold tracking-tight sm:text-4xl">
            Your personal collection manager
          </h1>
          <p className="text-muted-foreground max-w-md text-lg">
            Catalog, organize, and track the things you treasure — from art and
            antiques to cards and curiosities.
          </p>
          <Button size="lg" asChild>
            <Link to="/login">Get Started</Link>
          </Button>
        </section>

        {/* Features */}
        <section className="bg-muted/50 px-6 py-16">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-lg border p-6 text-center"
              >
                <f.icon className="text-primary mx-auto mb-3 h-8 w-8" />
                <h3 className="mb-1 text-lg font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
