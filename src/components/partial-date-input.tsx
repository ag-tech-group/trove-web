import { useMemo } from "react"
import {
  daysInMonth,
  monthNames,
  type PartialDateParts,
} from "@/lib/partial-date"
import { cn } from "@/lib/utils"

// Native selects rather than Radix ones: the inline editor commits when focus
// leaves this group, and a Radix Select's portal would take focus with it.
const controlClasses =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-md border px-2 text-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"

/** A year, with an optional month and, given a month, an optional day. */
export function PartialDateInput({
  value,
  onChange,
  disabled,
  autoFocus,
  invalid,
  idPrefix,
}: {
  value: PartialDateParts
  onChange: (value: PartialDateParts) => void
  disabled?: boolean
  autoFocus?: boolean
  invalid?: boolean
  idPrefix?: string
}) {
  const months = useMemo(() => monthNames(), [])
  const dayCount =
    /^\d{4}$/.test(value.year) && value.month
      ? daysInMonth(Number(value.year), Number(value.month))
      : 31

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        id={idPrefix ? `${idPrefix}-year` : undefined}
        aria-label="Year"
        aria-invalid={invalid}
        autoFocus={autoFocus}
        inputMode="numeric"
        maxLength={4}
        placeholder="Year"
        disabled={disabled}
        value={value.year}
        onChange={(e) =>
          onChange({ ...value, year: e.target.value.replace(/\D/g, "") })
        }
        className={cn(
          controlClasses,
          "w-20",
          "aria-invalid:border-destructive"
        )}
      />
      <select
        aria-label="Month"
        disabled={disabled || !value.year}
        value={value.month}
        onChange={(e) =>
          onChange({
            ...value,
            month: e.target.value,
            day: e.target.value ? value.day : "",
          })
        }
        className={cn(controlClasses, "w-32")}
      >
        <option value="">Month</option>
        {months.map((name, index) => (
          <option key={name} value={String(index + 1)}>
            {name}
          </option>
        ))}
      </select>
      <select
        aria-label="Day"
        disabled={disabled || !value.month}
        value={value.day}
        onChange={(e) => onChange({ ...value, day: e.target.value })}
        className={cn(controlClasses, "w-20")}
      >
        <option value="">Day</option>
        {Array.from({ length: dayCount }, (_, i) => String(i + 1)).map(
          (day) => (
            <option key={day} value={day}>
              {day}
            </option>
          )
        )}
      </select>
    </div>
  )
}
