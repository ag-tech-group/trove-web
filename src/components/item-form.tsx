import { useState, useRef } from "react"
import { ChevronDown, X, Plus } from "lucide-react"
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

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "unknown", label: "Unknown" },
]

interface ItemFormProps {
  defaultValues?: ItemRead
  collectionId?: string
  onSuccess: () => void
}

export function ItemForm({
  defaultValues,
  collectionId,
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

  // Provenance
  const [artistMaker, setArtistMaker] = useState(
    defaultValues?.artist_maker ?? ""
  )
  const [origin, setOrigin] = useState(defaultValues?.origin ?? "")
  const [dateEra, setDateEra] = useState(defaultValues?.date_era ?? "")
  const [provenanceNotes, setProvenanceNotes] = useState(
    defaultValues?.provenance_notes ?? ""
  )

  // Dimensions
  const [heightCm, setHeightCm] = useState(defaultValues?.height_cm ?? "")
  const [widthCm, setWidthCm] = useState(defaultValues?.width_cm ?? "")
  const [depthCm, setDepthCm] = useState(defaultValues?.depth_cm ?? "")
  const [weightKg, setWeightKg] = useState(defaultValues?.weight_kg ?? "")
  const [materials, setMaterials] = useState(defaultValues?.materials ?? "")

  // Notes
  const [notes, setNotes] = useState(defaultValues?.notes ?? "")

  const createMutation = useCreateItemItemsPost({
    mutation: {
      onSuccess: () => {
        toast.success("Item created")
        onSuccess()
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to create item"))
      },
    },
  })

  const updateMutation = useUpdateItemItemsItemIdPatch({
    mutation: {
      onSuccess: () => {
        toast.success("Item updated")
        onSuccess()
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to update item"))
      },
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const buildData = () => ({
    name,
    description: description || undefined,
    condition: (condition as Condition) || undefined,
    location: location || undefined,
    acquisition_date: acquisitionDate || undefined,
    acquisition_price: acquisitionPrice || undefined,
    estimated_value: estimatedValue || undefined,
    artist_maker: artistMaker || undefined,
    origin: origin || undefined,
    date_era: dateEra || undefined,
    provenance_notes: provenanceNotes || undefined,
    height_cm: heightCm || undefined,
    width_cm: widthCm || undefined,
    depth_cm: depthCm || undefined,
    weight_kg: weightKg || undefined,
    materials: materials || undefined,
    notes: notes || undefined,
    collection_id: collectionId ?? defaultValues?.collection_id ?? undefined,
    tag_ids: selectedTagIds,
  })

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

      {/* Acquisition section */}
      <CollapsibleSection title="Acquisition">
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
        </div>
      </CollapsibleSection>

      {/* Provenance section */}
      <CollapsibleSection title="Provenance">
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
          <div className="grid gap-1.5">
            <Label htmlFor="item-prov-notes">Provenance Notes</Label>
            <Textarea
              id="item-prov-notes"
              rows={2}
              value={provenanceNotes}
              onChange={(e) => setProvenanceNotes(e.target.value)}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Dimensions section */}
      <CollapsibleSection title="Dimensions">
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

      {/* Notes */}
      <div className="grid gap-1.5">
        <Label htmlFor="item-notes">Notes</Label>
        <Textarea
          id="item-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

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
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
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
