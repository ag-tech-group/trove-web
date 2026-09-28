import { useState, useRef } from "react"
import { ChevronDown, ChevronsUpDown, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useCreateItemItemsPost } from "@/api/generated/hooks/items/items"
import type {
  AcquisitionMethod,
  ItemRead,
  Condition,
} from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useCollectionTypes, findCollectionType } from "@/lib/collection-types"
import { CONDITIONS } from "@/lib/conditions"
import { ACQUISITION_METHODS } from "@/lib/acquisition-methods"
import {
  joinPartialDate,
  splitPartialDate,
  type PartialDateParts,
} from "@/lib/partial-date"
import { MeasurementError, parseLength, parseWeight } from "@/lib/units"
import { usePreferredUnits } from "@/lib/use-preferred-units"
import { PartialDateInput } from "@/components/partial-date-input"
import { UnitsToggle } from "@/components/measurement-row"
import { ImagePicker } from "@/components/image-picker"
import { TagInput } from "@/components/tag-input"

export interface StagedMark {
  title: string
  description: string
  files: File[]
}

export interface StagedNote {
  title: string
  body: string
}

interface ItemFormProps {
  collectionId?: string
  collectionType?: string
  onSuccess: (
    item: ItemRead,
    stagedFiles: File[],
    stagedMarks: StagedMark[],
    stagedNotes: StagedNote[]
  ) => void
}

export function ItemForm({
  collectionId,
  collectionType,
  onSuccess,
}: ItemFormProps) {
  const [name, setName] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [condition, setCondition] = useState<string>("")
  const [location, setLocation] = useState("")

  // Acquisition
  const [acquisitionDate, setAcquisitionDate] = useState<PartialDateParts>(() =>
    splitPartialDate(null)
  )
  const [acquisitionMethod, setAcquisitionMethod] = useState<string>("")
  const [acquisitionPrice, setAcquisitionPrice] = useState("")
  const [estimatedValue, setEstimatedValue] = useState("")

  // Acquisition (cont.)
  const [acquisitionSource, setAcquisitionSource] = useState("")
  const [acquisitionPlace, setAcquisitionPlace] = useState("")

  // Provenance
  const [artistMaker, setArtistMaker] = useState("")
  const [origin, setOrigin] = useState("")
  const [dateEra, setDateEra] = useState("")

  // Dimensions, as typed in the user's units; converted to metric on submit
  const { units } = usePreferredUnits()
  const [height, setHeight] = useState("")
  const [width, setWidth] = useState("")
  const [depth, setDepth] = useState("")
  const [length, setLength] = useState("")
  const [diameter, setDiameter] = useState("")
  const [weight, setWeight] = useState("")
  const [materials, setMaterials] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  // Type-specific fields
  const [typeFields, setTypeFields] = useState<Record<string, string>>({})
  const [stagedFiles, setStagedFiles] = useState<File[]>([])

  // Staged marks & notes
  const [stagedMarks, setStagedMarks] = useState<StagedMark[]>([])
  const [stagedNotes, setStagedNotes] = useState<StagedNote[]>([])

  // Section open states (for expand/collapse all)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const toggleSection = (key: string, value: boolean) =>
    setOpenSections((prev) => ({ ...prev, [key]: value }))

  const { types } = useCollectionTypes()
  const typeDef = findCollectionType(types, collectionType)

  const sectionKeys = [
    "acquisition",
    "provenance",
    ...(typeDef && typeDef.fields.length > 0 ? ["typeFields"] : []),
    "dimensions",
    "marks",
    "notes",
  ]
  const allExpanded = sectionKeys.every((k) => openSections[k])
  const toggleAll = () => {
    const next = !allExpanded
    const updated: Record<string, boolean> = {}
    for (const k of sectionKeys) updated[k] = next
    setOpenSections((prev) => ({ ...prev, ...updated }))
  }

  // Keep refs so mutation callbacks always see the latest value
  const stagedFilesRef = useRef<File[]>([])
  stagedFilesRef.current = stagedFiles
  const stagedMarksRef = useRef<StagedMark[]>([])
  stagedMarksRef.current = stagedMarks
  const stagedNotesRef = useRef<StagedNote[]>([])
  stagedNotesRef.current = stagedNotes

  const createMutation = useCreateItemItemsPost({
    mutation: {
      onSuccess: (res) => {
        if (res.status !== 201) return
        toast.success("Item created")
        onSuccess(
          res.data,
          stagedFilesRef.current,
          stagedMarksRef.current,
          stagedNotesRef.current
        )
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to create item"))
      },
    },
  })

  const isPending = createMutation.isPending

  // Throws MeasurementError for a measurement that can't be read.
  const lengthUnit = units === "imperial" ? "in" : "cm"
  const lengthPlaceholder = units === "imperial" ? "e.g. 3 1/2" : "e.g. 12.5"

  const toCm = (text: string) => {
    const cm = parseLength(text, units)
    return cm === null ? undefined : cm.toFixed(2)
  }
  const toKg = (text: string) => {
    const kg = parseWeight(text, units)
    return kg === null ? undefined : kg.toFixed(3)
  }

  const buildData = (acquired: string) => {
    // Only include type_fields if there are any non-empty values
    const nonEmptyTypeFields = Object.fromEntries(
      Object.entries(typeFields).filter(([, v]) => v !== "")
    )
    const hasTypeFields = Object.keys(nonEmptyTypeFields).length > 0

    return {
      name,
      reference_number: referenceNumber.trim() || undefined,
      description: description || undefined,
      condition: (condition as Condition) || undefined,
      location: location || undefined,
      acquisition_date: acquired || undefined,
      acquisition_method: (acquisitionMethod as AcquisitionMethod) || undefined,
      acquisition_price: acquisitionPrice || undefined,
      acquisition_source: acquisitionSource || undefined,
      acquisition_place: acquisitionPlace || undefined,
      estimated_value: estimatedValue || undefined,
      artist_maker: artistMaker || undefined,
      origin: origin || undefined,
      date_era: dateEra || undefined,
      height_cm: toCm(height),
      width_cm: toCm(width),
      depth_cm: toCm(depth),
      length_cm: toCm(length),
      diameter_cm: toCm(diameter),
      weight_kg: toKg(weight),
      materials: materials || undefined,
      collection_id: collectionId,
      tag_ids: selectedTagIds,
      type_fields: hasTypeFields ? nonEmptyTypeFields : undefined,
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const acquired = joinPartialDate(acquisitionDate)
    if (acquired === null) {
      setFormError("Enter an acquisition year, and a month and day that exist")
      return
    }
    let data: ReturnType<typeof buildData>
    try {
      data = buildData(acquired)
    } catch (err) {
      if (!(err instanceof MeasurementError)) throw err
      setFormError(err.message)
      return
    }
    setFormError(null)
    createMutation.mutate({ data })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Basic fields */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 grid gap-1.5">
          <Label htmlFor="item-name">Name *</Label>
          <Input
            id="item-name"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="item-reference">Reference No.</Label>
          <Input
            id="item-reference"
            maxLength={100}
            placeholder="e.g. A-01"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="item-desc">Description</Label>
        <Textarea
          id="item-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Tags</Label>
          <TagInput
            selectedTagIds={selectedTagIds}
            onChange={setSelectedTagIds}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Condition</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Images */}
      <ImagePicker files={stagedFiles} onChange={setStagedFiles} />

      {/* Expand / Collapse all */}
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
        onClick={toggleAll}
      >
        <ChevronsUpDown className="h-3.5 w-3.5" />
        {allExpanded ? "Collapse all" : "Expand all"}
      </button>

      {/* Acquisition section */}
      <CollapsibleSection
        title="Acquisition"
        open={!!openSections.acquisition}
        onOpenChange={(v) => toggleSection("acquisition", v)}
      >
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="item-acq-date-year">Date</Label>
            <PartialDateInput
              idPrefix="item-acq-date"
              value={acquisitionDate}
              onChange={setAcquisitionDate}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-acq-price">Purchase Price</Label>
              <Input
                id="item-acq-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={acquisitionPrice}
                onChange={(e) => setAcquisitionPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-value">Estimated Value</Label>
              <Input
                id="item-value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-location">Location</Label>
              <Input
                id="item-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Method</Label>
            <Select
              value={acquisitionMethod}
              onValueChange={setAcquisitionMethod}
            >
              <SelectTrigger aria-label="Acquisition method">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {ACQUISITION_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-acq-source">Source</Label>
              <Input
                id="item-acq-source"
                maxLength={200}
                placeholder="e.g. Auction house, Estate sale"
                value={acquisitionSource}
                onChange={(e) => setAcquisitionSource(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-acq-place">Place</Label>
              <Input
                id="item-acq-place"
                maxLength={200}
                placeholder="e.g. Paris"
                value={acquisitionPlace}
                onChange={(e) => setAcquisitionPlace(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Provenance section */}
      <CollapsibleSection
        title="Provenance"
        open={!!openSections.provenance}
        onOpenChange={(v) => toggleSection("provenance", v)}
      >
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-artist">Artist / Maker</Label>
              <Input
                id="item-artist"
                value={artistMaker}
                onChange={(e) => setArtistMaker(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-origin">Origin</Label>
              <Input
                id="item-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="item-date-era">Date / Era</Label>
            <Input
              id="item-date-era"
              value={dateEra}
              onChange={(e) => setDateEra(e.target.value)}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Type-specific fields */}
      {typeDef && typeDef.fields.length > 0 && (
        <CollapsibleSection
          title={`${typeDef.label} Details`}
          open={!!openSections.typeFields}
          onOpenChange={(v) => toggleSection("typeFields", v)}
        >
          <div className="grid gap-3">
            {typeDef.fields.map((field) =>
              field.type === "enum" ? (
                <div key={field.name} className="grid gap-1.5">
                  <Label>{field.label}</Label>
                  <Select
                    value={typeFields[field.name] ?? ""}
                    onValueChange={(v) =>
                      setTypeFields((prev) => ({ ...prev, [field.name]: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div key={field.name} className="grid gap-1.5">
                  <Label htmlFor={`tf-${field.name}`}>{field.label}</Label>
                  <Input
                    id={`tf-${field.name}`}
                    maxLength={field.max_length}
                    value={typeFields[field.name] ?? ""}
                    onChange={(e) =>
                      setTypeFields((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }))
                    }
                  />
                </div>
              )
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Dimensions section */}
      <CollapsibleSection
        title="Dimensions"
        open={!!openSections.dimensions}
        onOpenChange={(v) => toggleSection("dimensions", v)}
      >
        <div className="grid gap-3">
          <div className="flex justify-end">
            <UnitsToggle />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-h">Height ({lengthUnit})</Label>
              <Input
                id="item-h"
                inputMode="decimal"
                placeholder={lengthPlaceholder}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-w">Width ({lengthUnit})</Label>
              <Input
                id="item-w"
                inputMode="decimal"
                placeholder={lengthPlaceholder}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-d">Depth ({lengthUnit})</Label>
              <Input
                id="item-d"
                inputMode="decimal"
                placeholder={lengthPlaceholder}
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-l">Length ({lengthUnit})</Label>
              <Input
                id="item-l"
                inputMode="decimal"
                placeholder={lengthPlaceholder}
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-diameter">Diameter ({lengthUnit})</Label>
              <Input
                id="item-diameter"
                inputMode="decimal"
                placeholder={lengthPlaceholder}
                value={diameter}
                onChange={(e) => setDiameter(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-weight">
                Weight ({units === "imperial" ? "lb" : "kg"})
              </Label>
              <Input
                id="item-weight"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-materials">Materials</Label>
              <Input
                id="item-materials"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Marks section */}
      <CollapsibleSection
        title="Marks"
        open={!!openSections.marks}
        onOpenChange={(v) => toggleSection("marks", v)}
      >
        <StagedMarkList marks={stagedMarks} onChange={setStagedMarks} />
      </CollapsibleSection>

      {/* Notes section */}
      <CollapsibleSection
        title="Notes"
        open={!!openSections.notes}
        onOpenChange={(v) => toggleSection("notes", v)}
      >
        <StagedNoteList notes={stagedNotes} onChange={setStagedNotes} />
      </CollapsibleSection>

      {formError && (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Item"}
        </Button>
      </div>
    </form>
  )
}

function StagedMarkList({
  marks,
  onChange,
}: {
  marks: StagedMark[]
  onChange: (marks: StagedMark[]) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const handleAdd = () => {
    onChange([...marks, { title, description, files }])
    setTitle("")
    setDescription("")
    setFiles([])
  }

  return (
    <div className="grid gap-3">
      {marks.length > 0 && (
        <div className="space-y-2">
          {marks.map((mark, i) => (
            <div
              key={i}
              className="border-border flex items-start justify-between gap-3 rounded-md border p-2"
            >
              <div className="min-w-0 flex-1 text-sm">
                {mark.title && <p className="font-medium">{mark.title}</p>}
                {mark.description && (
                  <p className="text-muted-foreground truncate">
                    {mark.description}
                  </p>
                )}
                {!mark.title && !mark.description && (
                  <p className="text-muted-foreground italic">No details</p>
                )}
                {mark.files.length > 0 && (
                  <p className="text-muted-foreground text-xs">
                    {mark.files.length}{" "}
                    {mark.files.length === 1 ? "image" : "images"}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onChange(marks.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="staged-mark-title">Title *</Label>
          <Input
            id="staged-mark-title"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="staged-mark-desc">Description</Label>
          <Textarea
            id="staged-mark-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <ImagePicker files={files} onChange={setFiles} maxImages={3} />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={!title.trim()}
            onClick={handleAdd}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {marks.length > 0 ? "Add another" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function StagedNoteList({
  notes,
  onChange,
}: {
  notes: StagedNote[]
  onChange: (notes: StagedNote[]) => void
}) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  const handleAdd = () => {
    onChange([...notes, { title, body }])
    setTitle("")
    setBody("")
  }

  return (
    <div className="grid gap-3">
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note, i) => (
            <div
              key={i}
              className="border-border flex items-start justify-between gap-3 rounded-md border p-2"
            >
              <div className="min-w-0 flex-1 text-sm">
                {note.title && <p className="font-medium">{note.title}</p>}
                <p className="text-muted-foreground truncate">{note.body}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onChange(notes.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="staged-note-title">Title</Label>
          <Input
            id="staged-note-title"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="staged-note-body">Body *</Label>
          <Textarea
            id="staged-note-body"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={!body.trim()}
            onClick={handleAdd}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {notes.length > 0 ? "Add another" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CollapsibleSection({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1 text-sm font-medium transition-colors"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
          {title}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}
