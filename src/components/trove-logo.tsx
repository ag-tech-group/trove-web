import { cn } from "@/lib/utils"

function TroveFrameIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 88 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="4"
        y="4"
        width="80"
        height="56"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="10"
        y="10"
        width="68"
        height="44"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
      />
      <rect
        x="14"
        y="14"
        width="60"
        height="36"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <ellipse
        cx="44"
        cy="4"
        rx="8"
        ry="3"
        stroke="currentColor"
        strokeWidth="1"
        fill="transparent"
      />
      <circle cx="44" cy="4" r="1.5" fill="currentColor" />
      <ellipse
        cx="44"
        cy="60"
        rx="8"
        ry="3"
        stroke="currentColor"
        strokeWidth="1"
        fill="transparent"
      />
      <path
        d="M4 28 Q0 32 4 36"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M84 28 Q88 32 84 36"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  )
}

function TroveLogo({
  className,
  showTagline = false,
  layout = "horizontal",
}: {
  className?: string
  showTagline?: boolean
  layout?: "horizontal" | "vertical"
}) {
  return (
    <div
      className={cn(
        "flex items-center",
        layout === "horizontal" ? "flex-row gap-4" : "flex-col gap-3",
        className
      )}
    >
      <TroveFrameIcon
        className={cn("text-primary", layout === "horizontal" ? "h-8" : "h-14")}
      />
      <div className="flex flex-col items-center gap-1">
        <span className="text-primary font-serif text-4xl font-light tracking-[0.35em] uppercase">
          Trove
        </span>
        {showTagline && (
          <span className="text-primary/85 font-serif text-sm font-light tracking-[0.4em] uppercase">
            Collection Management
          </span>
        )}
      </div>
    </div>
  )
}

export { TroveFrameIcon, TroveLogo }
