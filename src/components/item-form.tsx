import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"
import {
  useCreateItemItemsPost,
  useUpdateItemItemsItemIdPatch,
} from "@/api/generated/hooks/items/items"
import { useListCategoriesCategoriesGet } from "@/api/generated/hooks/categories/categories"
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
  const [category, setCategory] = useState(defaultValues?.category ?? "")
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

  const { data: categoriesRes } = useListCategoriesCategoriesGet()
  const categories = categoriesRes?.data ?? []

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
    category: category || undefined,
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
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
