import { cn } from "@/lib/utils"
import { AppHeader } from "@/components/app-header"
import { Footer } from "@/components/footer"

export function AppLayout({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className={cn("flex-1 px-6 py-8", className)}>{children}</main>
      <Footer />
    </div>
  )
}
