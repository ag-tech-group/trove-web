import { useState, useRef } from "react"
import { ChevronDown, ChevronsUpDown, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useCreateItemItemsPost } from "@/api/generated/hooks/items/items"
import type { ItemRead, Condition } from "@/api/generated/types"
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
  const [description, setDescription] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [condition, setCondition] = useState<string>("")
  const [location, setLocation] = useState("")

  // Acquisition
  const [acquisitionDate, setAcquisitionDate] = useState("")
  const [acquisitionPrice, setAcquisitionPrice] = useState("")
  const [estimatedValue, setEstimatedValue] = useState("")

  // Acquisition (cont.)
  const [acquisitionSource, setAcquisitionSource] = useState("")

  // Provenance
  const [artistMaker, setArtistMaker] = useState("")
  const [origin, setOrigin] = useState("")
  const [dateEra, setDateEra] = useState("")

  // Dimensions
  const [heightCm, setHeightCm] = useState("")
  const [widthCm, setWidthCm] = useState("")
  const [depthCm, setDepthCm] = useState("")
  const [weightKg, setWeightKg] = useState("")
  const [materials, setMaterials] = useState("")

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

  const buildData = () => {
    // Only include type_fields if there are any non-empty values
    const nonEmptyTypeFields = Object.fromEntries(
      Object.entries(typeFields).filter(([, v]) => v !== "")
    )
    const hasTypeFields = Object.keys(nonEmptyTypeFields).length > 0

    return {
      name,
      description: description || undefined,
      condition: (condition as Condition) || undefined,
      location: location || undefined,
      acquisition_date: acquisitionDate || undefined,
      acquisition_price: acquisitionPrice || undefined,
      acquisition_source: acquisitionSource || undefined,
      estimated_value: estimatedValue || undefined,
      artist_maker: artistMaker || undefined,
      origin: origin || undefined,
      date_era: dateEra || undefined,
      height_cm: heightCm || undefined,
      width_cm: widthCm || undefined,
      depth_cm: depthCm || undefined,
      weight_kg: weightKg || undefined,
      materials: materials || undefined,
      collection_id: collectionId,
      tag_ids: selectedTagIds,
      type_fields: hasTypeFields ? nonEmptyTypeFields : undefined,
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ data: buildData() })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Basic fields */}
      <div className="grid gap-1.5">
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
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-acq-date">Date</Label>
              <Input
                id="item-acq-date"
                type="date"
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
              />
            </div>
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
            <Label htmlFor="item-acq-source">Source</Label>
            <Input
              id="item-acq-source"
              maxLength={200}
              placeholder="e.g. Auction house, Estate sale"
              value={acquisitionSource}
              onChange={(e) => setAcquisitionSource(e.target.value)}
            />
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
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-h">Height (cm)</Label>
              <Input
                id="item-h"
                type="number"
                step="0.1"
                min="0"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-w">Width (cm)</Label>
              <Input
                id="item-w"
                type="number"
                step="0.1"
                min="0"
                value={widthCm}
                onChange={(e) => setWidthCm(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-d">Depth (cm)</Label>
              <Input
                id="item-d"
                type="number"
                step="0.1"
                min="0"
                value={depthCm}
                onChange={(e) => setDepthCm(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-weight">Weight (kg)</Label>
              <Input
                id="item-weight"
                type="number"
                step="0.01"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
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
