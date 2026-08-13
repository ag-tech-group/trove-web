import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import { cn } from "@/lib/utils"
import { badgeVariants } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TagInput } from "@/components/tag-input"

// Shared geometry for every bare edit control: matching the read-mode
// button's box exactly is the entire point of these components, so this
// string exists once instead of being hand-repeated per field.
const fieldClasses =
  "focus-visible:border-ring focus-visible:ring-ring/50 -mx-1.5 w-[calc(100%+0.75rem)] rounded border border-transparent bg-transparent px-1.5 py-0.5 outline-none transition-colors focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"

type FlushFn = () => Promise<void>

const InlineEditFlushContext = createContext<{
  register: (fn: FlushFn) => () => void
  flushAll: () => Promise<void>
} | null>(null)

/**
 * Wrap a group of inline-edit fields so an in-progress edit (draft typed
 * but not yet blurred) can be committed before the page navigates away —
 * `onBlur` is the only other commit path, and browser back/forward or a
 * programmatic `navigate()` unmounts fields without ever firing it.
 * Pair with `useFlushPendingEdits()` at the point that guards navigation.
 */
export function InlineEditFlushScope({
  children,
}: {
  children: React.ReactNode
}) {
  const [ctx] = useState(() => {
    const fns = new Set<FlushFn>()
    return {
      register: (fn: FlushFn) => {
        fns.add(fn)
        return () => {
          fns.delete(fn)
        }
      },
      flushAll: async () => {
        await Promise.all([...fns].map((fn) => fn().catch(() => {})))
      },
    }
  })
  return (
    <InlineEditFlushContext.Provider value={ctx}>
      {children}
    </InlineEditFlushContext.Provider>
  )
}

/** Commits every currently-editing field inside the nearest `InlineEditFlushScope`. */
export function useFlushPendingEdits(): () => Promise<void> {
  const ctx = useContext(InlineEditFlushContext)
  return ctx ? ctx.flushAll : async () => {}
}

/**
 * Owns the click-to-edit state machine shared by every inline field:
 * editing/draft/saving, resyncing the draft when the source value changes
 * externally, Escape-to-revert, and commit-on-blur with a required check.
 * Validation errors get their own state (per repo convention) since
 * they're synchronous and not tied to the save mutation's lifecycle.
 */
function useInlineEdit({
  value,
  onSave,
  required,
  requiredMessage = "This field is required",
  trim = false,
}: {
  value: string
  onSave: (value: string) => Promise<void>
  required?: boolean
  requiredMessage?: string
  trim?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const start = () => {
    setError(null)
    setEditing(true)
  }

  const cancel = () => {
    setDraft(value)
    setError(null)
    setEditing(false)
  }

  // Idempotent: a second call while a save is already in flight (e.g. the
  // navigate-away flush firing right after a blur-triggered commit) just
  // returns the same in-flight promise instead of double-submitting.
  const commit = (): Promise<void> => {
    if (pendingRef.current) return pendingRef.current
    const next = trim ? draft.trim() : draft
    if (required && !next) {
      setError(requiredMessage)
      return Promise.resolve()
    }
    if (next === value) {
      setError(null)
      setEditing(false)
      return Promise.resolve()
    }
    const promise = (async () => {
      setSaving(true)
      setError(null)
      try {
        await onSave(next)
        setEditing(false)
      } catch {
        // error toast surfaced by the caller; stay in edit mode so the draft isn't lost
      } finally {
        setSaving(false)
        pendingRef.current = null
      }
    })()
    pendingRef.current = promise
    return promise
  }

  // Registered with the nearest InlineEditFlushScope so a pending draft
  // can be committed on navigate-away instead of silently discarded.
  const flushRef = useRef<FlushFn>(() => Promise.resolve())
  flushRef.current = () => (editing ? commit() : Promise.resolve())
  const registerFlush = useContext(InlineEditFlushContext)?.register
  useEffect(() => {
    if (!registerFlush) return
    return registerFlush(() => flushRef.current())
  }, [registerFlush])

  return { editing, draft, setDraft, saving, error, start, cancel, commit }
}

/** Large click-to-edit text field with no label — used for the item title. */
export function InlineText({
  value,
  onSave,
  placeholder = "Untitled",
  required,
  maxLength,
  className,
  ariaLabel,
}: {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
  required?: boolean
  maxLength?: number
  className?: string
  ariaLabel?: string
}) {
  const { editing, draft, setDraft, saving, error, start, cancel, commit } =
    useInlineEdit({ value, onSave, required, trim: true })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (error) inputRef.current?.focus()
  }, [error])

  if (editing) {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-2">
        <input
          ref={inputRef}
          autoFocus
          maxLength={maxLength}
          value={draft}
          disabled={saving}
          aria-invalid={!!error}
          aria-label={ariaLabel}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              cancel()
            }
            if (e.key === "Enter") {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          // A bare input (not the shared Input component) so nothing but
          // `className` controls font size — Input's own `md:text-sm`
          // would otherwise silently shrink the title at desktop widths.
          className={cn(fieldClasses, "-my-0.5 py-0.5", className)}
        />
        {error && (
          <span role="alert" className="text-destructive text-sm font-normal">
            {error}
          </span>
        )}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={start}
      aria-label={ariaLabel}
      className={cn(
        "hover:bg-muted/50 -mx-1.5 -my-0.5 rounded px-1.5 py-0.5 text-left transition-colors",
        !value && "text-muted-foreground italic",
        className
      )}
    >
      {value || placeholder}
    </button>
  )
}

/**
 * Label + click-to-edit value. `layout="row"` (default) matches the
 * page's label-left detail-row style; `layout="stacked"` puts a small
 * caption above a full-width value, for compact fields inside a grid.
 */
export function InlineRow({
  label,
  value,
  onSave,
  type = "text",
  placeholder = "Add...",
  formatDisplay,
  min,
  step,
  layout = "row",
  rows = 2,
  className,
}: {
  label: string
  value: string
  onSave: (value: string) => Promise<void>
  type?: "text" | "textarea" | "number" | "date"
  placeholder?: string
  formatDisplay?: (value: string) => string
  min?: string
  step?: string
  layout?: "row" | "stacked"
  rows?: number
  className?: string
}) {
  const { editing, draft, setDraft, saving, start, cancel, commit } =
    useInlineEdit({ value, onSave })
  const fieldId = useId()

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Escape") {
      e.preventDefault()
      cancel()
    }
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault()
      e.currentTarget.blur()
    }
    if (e.key === "Enter" && type === "textarea" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  // Bare elements (not the shared Input/Textarea) so nothing but these
  // classes controls font size, padding, or border — matching the
  // read-mode button exactly keeps editing from jumping in place.
  const editor =
    type === "textarea" ? (
      <textarea
        id={fieldId}
        autoFocus
        rows={rows}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(fieldClasses, "resize-none text-sm leading-relaxed")}
      />
    ) : (
      <input
        id={fieldId}
        autoFocus
        type={type}
        min={min}
        step={step}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onWheel={type === "number" ? (e) => e.currentTarget.blur() : undefined}
        onKeyDown={handleKeyDown}
        className={cn(fieldClasses, "text-sm")}
      />
    )

  const displayValue = value ? (
    formatDisplay ? (
      formatDisplay(value)
    ) : (
      value
    )
  ) : (
    <span className="text-muted-foreground italic">{placeholder}</span>
  )

  if (layout === "stacked") {
    return (
      <div className={cn("text-sm", className)}>
        <Label
          htmlFor={fieldId}
          className="text-muted-foreground mb-1 block text-xs font-medium"
        >
          {label}
        </Label>
        {editing ? (
          editor
        ) : (
          <button
            type="button"
            id={fieldId}
            onClick={start}
            className="hover:bg-muted/50 -mx-1.5 block w-[calc(100%+0.75rem)] rounded px-1.5 py-0.5 text-left whitespace-pre-wrap transition-colors"
          >
            {displayValue}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex gap-4 text-sm", className)}>
      <Label
        htmlFor={fieldId}
        className="text-muted-foreground w-36 shrink-0 pt-1 font-medium"
      >
        {label}
      </Label>
      {editing ? (
        editor
      ) : (
        <button
          type="button"
          id={fieldId}
          onClick={start}
          className="hover:bg-muted/50 -mx-1.5 flex-1 rounded px-1.5 py-0.5 text-left whitespace-pre-wrap transition-colors"
        >
          {displayValue}
        </button>
      )}
    </div>
  )
}

// Radix Select can't emit an empty-string item value, so a sentinel
// stands in for "clear this field" and gets mapped back to "" in onSave.
const CLEAR_VALUE = "__clear__"

/** Badge-styled select that opens on a single click and auto-saves on choice. */
export function InlineSelectBadge<T extends string>({
  value,
  onSave,
  options,
  placeholder = "+ Select",
}: {
  value: T | ""
  onSave: (value: T | "") => Promise<void>
  options: { value: T; label: string }[]
  placeholder?: string
}) {
  const [saving, setSaving] = useState(false)

  const handleChange = async (v: string) => {
    setSaving(true)
    try {
      await onSave(v === CLEAR_VALUE ? "" : (v as T))
    } catch {
      // error toast surfaced by the caller
    } finally {
      setSaving(false)
    }
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger
        size="sm"
        className={cn(
          badgeVariants({ variant: "outline" }),
          "h-auto gap-1 border-dashed py-0.5 capitalize [&_svg]:opacity-60"
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {value && (
          <SelectItem value={CLEAR_VALUE} className="text-muted-foreground">
            — None —
          </SelectItem>
        )}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Tag badges that switch to the tag picker on click and auto-save each change. */
export function InlineTagsBadges({
  tags,
  onSave,
}: {
  tags: { id: string; name: string }[]
  onSave: (tagIds: string[]) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draftIds, setDraftIds] = useState<string[]>([])

  const startEditing = () => {
    setDraftIds(tags.map((t) => t.id))
    setEditing(true)
  }

  const handleChange = (ids: string[]) => {
    const previous = draftIds
    setDraftIds(ids)
    onSave(ids).catch(() => setDraftIds(previous))
  }

  if (editing) {
    return (
      <div
        className="w-56"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setEditing(false)
          }
        }}
      >
        <TagInput selectedTagIds={draftIds} onChange={handleChange} autoFocus />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      aria-label="Edit tags"
      className="flex flex-wrap items-center gap-2"
    >
      {tags.length > 0 ? (
        tags.map((t) => (
          <span key={t.id} className={badgeVariants({ variant: "secondary" })}>
            {t.name}
          </span>
        ))
      ) : (
        <span
          className={cn(
            badgeVariants({ variant: "outline" }),
            "text-muted-foreground border-dashed"
          )}
        >
          + Tags
        </span>
      )}
    </button>
  )
}
