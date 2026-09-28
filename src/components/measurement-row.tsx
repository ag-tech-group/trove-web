import { toast } from "sonner"
import { InlineRow } from "@/components/inline-edit"
import { getErrorMessage } from "@/lib/api-errors"
import {
  formatLength,
  formatWeight,
  lengthInputValue,
  MeasurementError,
  parseLength,
  parseWeight,
  weightInputValue,
  type Units,
} from "@/lib/units"
import { usePreferredUnits } from "@/lib/use-preferred-units"
import { cn } from "@/lib/utils"

/**
 * A length or weight, stored metric, shown and edited in the user's units.
 * `onSave` receives the metric value as the API takes it, or null to clear.
 */
export function MeasurementRow({
  label,
  value,
  kind,
  units,
  onSave,
  placeholder,
}: {
  label: string
  value: string | null | undefined
  kind: "length" | "weight"
  units: Units
  onSave: (metric: string | null) => Promise<void>
  placeholder?: string
}) {
  const isLength = kind === "length"
  return (
    <InlineRow
      label={label}
      value={
        isLength
          ? lengthInputValue(value, units)
          : weightInputValue(value, units)
      }
      onSave={async (typed) => {
        let metric: number | null
        try {
          metric = isLength
            ? parseLength(typed, units)
            : parseWeight(typed, units)
        } catch (err) {
          if (err instanceof MeasurementError) toast.error(err.message)
          throw err
        }
        await onSave(metric === null ? null : metric.toFixed(isLength ? 2 : 3))
      }}
      placeholder={placeholder}
      formatDisplay={() =>
        isLength ? formatLength(value, units) : formatWeight(value, units)
      }
    />
  )
}

/** Switches the signed-in user's display units, saved to their account. */
export function UnitsToggle({ className }: { className?: string }) {
  const { units, setUnits, saving } = usePreferredUnits()
  const choose = (next: Units) => {
    if (next === units) return
    setUnits(next).catch(async (err) =>
      toast.error(await getErrorMessage(err, "Couldn't change units"))
    )
  }

  return (
    <div
      role="group"
      aria-label="Units"
      className={cn(
        "inline-flex overflow-hidden rounded-md border text-xs",
        className
      )}
    >
      {(
        [
          ["metric", "cm · kg"],
          ["imperial", "in · lb"],
        ] as const
      ).map(([option, label]) => (
        <button
          key={option}
          type="button"
          aria-pressed={units === option}
          disabled={saving}
          onClick={() => choose(option)}
          className={cn(
            "px-2 py-0.5 transition-colors",
            units === option
              ? "bg-muted font-medium"
              : "text-muted-foreground hover:bg-muted/50"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
