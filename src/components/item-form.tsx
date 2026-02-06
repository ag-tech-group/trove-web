import { useState, useRef } from "react"
import { ChevronDown, ChevronsUpDown, X, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import {
  useCreateItemItemsPost,
  useUpdateItemItemsItemIdPatch,
} from "@/api/generated/hooks/items/items"
import {
  useListTagsTagsGet,
  useCreateTagTagsPost,
  getListTagsTagsGetQueryKey,
} from "@/api/generated/hooks/tags/tags"
import type { ItemRead, Condition, TagRead } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { ImagePicker } from "@/components/image-picker"

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "unknown", label: "Unknown" },
]

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
  defaultValues?: ItemRead
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
  defaultValues,
  collectionId,
  collectionType,
  onSuccess,
}: ItemFormProps) {
  const isEdit = !!defaultValues

  const [name, setName] = useState(defaultValues?.name ?? "")
  const [description, setDescription] = useState(
    defaultValues?.description ?? ""
  )
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    defaultValues?.tags?.map((t) => t.id) ?? []
  )
  const [condition, setCondition] = useState<string>(
    defaultValues?.condition ?? ""
  )
  const [location, setLocation] = useState(defaultValues?.location ?? "")

  // Acquisition
  const [acquisitionDate, setAcquisitionDate] = useState(
    defaultValues?.acquisition_date ?? ""
  )
  const [acquisitionPrice, setAcquisitionPrice] = useState(
    defaultValues?.acquisition_price ?? ""
  )
  const [estimatedValue, setEstimatedValue] = useState(
    defaultValues?.estimated_value ?? ""
  )

  // Acquisition (cont.)
  const [acquisitionSource, setAcquisitionSource] = useState(
    defaultValues?.acquisition_source ?? ""
  )

  // Provenance
  const [artistMaker, setArtistMaker] = useState(
    defaultValues?.artist_maker ?? ""
  )
  const [origin, setOrigin] = useState(defaultValues?.origin ?? "")
  const [dateEra, setDateEra] = useState(defaultValues?.date_era ?? "")

  // Dimensions
  const [heightCm, setHeightCm] = useState(defaultValues?.height_cm ?? "")
  const [widthCm, setWidthCm] = useState(defaultValues?.width_cm ?? "")
  const [depthCm, setDepthCm] = useState(defaultValues?.depth_cm ?? "")
  const [weightKg, setWeightKg] = useState(defaultValues?.weight_kg ?? "")
  const [materials, setMaterials] = useState(defaultValues?.materials ?? "")

  // Type-specific fields
  const [typeFields, setTypeFields] = useState<Record<string, string>>(() => {
    const tf = defaultValues?.type_fields
    if (!tf || typeof tf !== "object") return {}
    const result: Record<string, string> = {}
    for (const [k, v] of Object.entries(tf)) {
      if (typeof v === "string") result[k] = v
    }
    return result
  })
  const [stagedFiles, setStagedFiles] = useState<File[]>([])

  // Staged marks & notes (create mode only)
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
    ...(!isEdit ? ["marks", "notes"] : []),
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

  const updateMutation = useUpdateItemItemsItemIdPatch({
    mutation: {
      onSuccess: (res) => {
        if (res.status !== 200) return
        toast.success("Item updated")
        onSuccess(
          res.data,
          stagedFilesRef.current,
          stagedMarksRef.current,
          stagedNotesRef.current
        )
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to update item"))
      },
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

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
      collection_id: collectionId ?? defaultValues?.collection_id ?? undefined,
      tag_ids: selectedTagIds,
      type_fields: hasTypeFields ? nonEmptyTypeFields : undefined,
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit && defaultValues) {
      updateMutation.mutate({ itemId: defaultValues.id, data: buildData() })
    } else {
      createMutation.mutate({ data: buildData() })
    }
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

      {/* Marks section (create only) */}
      {!isEdit && (
        <CollapsibleSection
          title="Marks"
          open={!!openSections.marks}
          onOpenChange={(v) => toggleSection("marks", v)}
        >
          <StagedMarkList marks={stagedMarks} onChange={setStagedMarks} />
        </CollapsibleSection>
      )}

      {/* Notes section (create only) */}
      {!isEdit && (
        <CollapsibleSection
          title="Notes"
          open={!!openSections.notes}
          onOpenChange={(v) => toggleSection("notes", v)}
        >
          <StagedNoteList notes={stagedNotes} onChange={setStagedNotes} />
        </CollapsibleSection>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save"
              : "Create Item"}
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

function TagInput({
  selectedTagIds,
  onChange,
}: {
  selectedTagIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [inputValue, setInputValue] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: tagsRes } = useListTagsTagsGet()
  const allTags = tagsRes?.data ?? []

  const createTagMutation = useCreateTagTagsPost({
    mutation: {
      onSuccess: (res) => {
        if (res.status === 201) {
          queryClient.invalidateQueries({
            queryKey: getListTagsTagsGetQueryKey(),
          })
          onChange([...selectedTagIds, res.data.id])
          setInputValue("")
        }
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to create tag"))
      },
    },
  })

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id))
  const filtered = allTags.filter(
    (t) =>
      !selectedTagIds.includes(t.id) &&
      t.name.toLowerCase().includes(inputValue.toLowerCase())
  )
  const exactMatch = allTags.some(
    (t) => t.name.toLowerCase() === inputValue.trim().toLowerCase()
  )
  const canCreate = inputValue.trim().length > 0 && !exactMatch

  const toggleTag = (tag: TagRead) => {
    if (selectedTagIds.includes(tag.id)) {
      onChange(selectedTagIds.filter((id) => id !== tag.id))
    } else {
      onChange([...selectedTagIds, tag.id])
      setInputValue("")
    }
  }

  const removeTag = (tagId: string) => {
    onChange(selectedTagIds.filter((id) => id !== tagId))
  }

  const handleCreateTag = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    createTagMutation.mutate({ data: { name: trimmed } })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Backspace" &&
      inputValue === "" &&
      selectedTagIds.length > 0
    ) {
      onChange(selectedTagIds.slice(0, -1))
    }
    if (e.key === "Enter") {
      e.preventDefault()
      if (filtered.length > 0) {
        toggleTag(filtered[0])
      } else if (canCreate) {
        handleCreateTag()
      }
    }
  }

  return (
    <div className="relative">
      <div
        className="border-input focus-within:border-ring focus-within:ring-ring/50 flex min-h-9 flex-wrap items-center gap-1 rounded-md border bg-transparent px-2 py-1 text-sm focus-within:ring-[3px]"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-0.5 pr-1">
            {tag.name}
            <button
              type="button"
              className="hover:text-foreground ml-0.5 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag.id)
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          className="placeholder:text-muted-foreground min-w-[60px] flex-1 bg-transparent py-0.5 outline-none"
          placeholder={selectedTags.length === 0 ? "Add tags..." : ""}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => {
            // Delay to allow click on dropdown items
            setTimeout(() => setDropdownOpen(false), 150)
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {dropdownOpen && (filtered.length > 0 || canCreate) && (
        <div className="border-border bg-popover text-popover-foreground absolute top-full z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-md border shadow-md">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="hover:bg-accent hover:text-accent-foreground w-full px-3 py-1.5 text-left text-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                toggleTag(tag)
                inputRef.current?.focus()
              }}
            >
              {tag.name}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                handleCreateTag()
                inputRef.current?.focus()
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create &ldquo;{inputValue.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
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
