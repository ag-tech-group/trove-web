import { useState } from "react"
import {
  Link,
  useBlocker,
  useNavigate,
  useParams,
} from "@tanstack/react-router"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
  Trash2,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  useGetItemItemsItemIdGet,
  useDeleteItemItemsItemIdDelete,
  getGetItemItemsItemIdGetQueryKey,
  getListItemsItemsGetQueryKey,
} from "@/api/generated/hooks/items/items"
import {
  useUploadItemImageItemsItemIdImagesPost,
  useDeleteItemImageItemsItemIdImagesImageIdDelete,
} from "@/api/generated/hooks/item-images/item-images"
import {
  getGetCollectionCollectionsCollectionIdGetQueryKey,
  useGetCollectionCollectionsCollectionIdGet,
} from "@/api/generated/hooks/collections/collections"
import { useCollectionTypes, findCollectionType } from "@/lib/collection-types"
import type { ItemRead, Condition } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { useItemAutosave, type AutosaveStatus } from "@/lib/use-item-autosave"
import { AppLayout } from "@/components/app-layout"
import { ImageCarousel } from "@/components/image-carousel"
import { ImageLightbox } from "@/components/image-lightbox"
import { ImageUpload } from "@/components/image-upload"
import { CONDITIONS } from "@/lib/conditions"
import {
  InlineText,
  InlineRow,
  InlineSelectBadge,
  InlineTagsBadges,
  InlineEditFlushScope,
  useFlushPendingEdits,
} from "@/components/inline-edit"
import { MarkList } from "@/components/mark-list"
import { ProvenanceList } from "@/components/provenance-list"
import { ItemNoteList } from "@/components/item-note-list"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

export function ItemDetailPage() {
  const { itemId } = useParams({ from: "/items/$itemId" })
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const sectionKeys = [
    "details",
    "images",
    "provenance",
    "dimensions",
    "marks",
    "notes",
  ]
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(sectionKeys.map((k) => [k, true]))
  )
  const toggleSection = (key: string, value: boolean) =>
    setOpenSections((prev) => ({ ...prev, [key]: value }))
  const allExpanded = sectionKeys.every((k) => openSections[k])
  const toggleAll = () => {
    const next = !allExpanded
    const updated: Record<string, boolean> = {}
    for (const k of sectionKeys) updated[k] = next
    setOpenSections((prev) => ({ ...prev, ...updated }))
  }

  const { data: itemRes, isLoading } = useGetItemItemsItemIdGet(itemId)
  const item = itemRes?.status === 200 ? itemRes.data : undefined

  const { data: collectionRes } = useGetCollectionCollectionsCollectionIdGet(
    item?.collection_id ?? "",
    { query: { enabled: !!item?.collection_id } }
  )
  const collection =
    collectionRes?.status === 200 ? collectionRes.data : undefined
  const collectionType = collection?.type

  const { types } = useCollectionTypes()
  const typeDef = findCollectionType(types, collectionType)

  const backTo = item?.collection_id
    ? `/collections/${item.collection_id}`
    : "/"
  const backLabel = item?.collection_id ? "Back to collection" : "Collections"

  const {
    save: saveField,
    saveTypeField,
    flush: flushAutosave,
    status: autosaveStatus,
  } = useItemAutosave(itemId, item)

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <Link
          to={backTo}
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        {isLoading ? (
          <ItemHeaderSkeleton />
        ) : item ? (
          <InlineEditFlushScope>
            <FlushOnNavigate flushAutosave={flushAutosave} />
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  <InlineText
                    value={item.name}
                    onSave={(v) => saveField({ name: v })}
                    required
                    maxLength={200}
                    ariaLabel="Edit name"
                  />
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <InlineTagsBadges
                    tags={item.tags ?? []}
                    onSave={(tagIds) => saveField({ tag_ids: tagIds })}
                  />
                  <InlineSelectBadge<Condition>
                    value={
                      item.condition && item.condition !== "unknown"
                        ? item.condition
                        : ""
                    }
                    onSave={(v) => saveField({ condition: v || null })}
                    options={CONDITIONS}
                    placeholder="+ Condition"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AutosaveIndicator status={autosaveStatus} />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Delete item"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Hero image carousel — full width */}
            {item.images && item.images.length > 0 && (
              <div className="mb-6">
                <ImageCarousel
                  images={item.images}
                  aspectRatio="aspect-video"
                  showDots
                  showArrows
                  onImageClick={(index) => {
                    setLightboxIndex(index)
                    setLightboxOpen(true)
                  }}
                />
                <ImageLightbox
                  images={item.images}
                  open={lightboxOpen}
                  index={lightboxIndex}
                  onClose={() => setLightboxOpen(false)}
                />
              </div>
            )}

            {/* Expand / Collapse all */}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1 text-xs transition-colors"
              onClick={toggleAll}
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>

            {/* Sections */}
            <div className="space-y-2">
              <DetailSection
                title="Details"
                open={!!openSections.details}
                onOpenChange={(v) => toggleSection("details", v)}
              >
                <div className="space-y-4">
                  <InlineRow
                    label="Description"
                    value={item.description ?? ""}
                    onSave={(v) => saveField({ description: v || null })}
                    type="textarea"
                    layout="stacked"
                    rows={4}
                    placeholder="Add a description..."
                  />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InlineRow
                      layout="stacked"
                      label="Location"
                      value={item.location ?? ""}
                      onSave={(v) => saveField({ location: v || null })}
                      placeholder="Add location..."
                    />
                    <InlineRow
                      layout="stacked"
                      label="Acquisition Date"
                      value={item.acquisition_date ?? ""}
                      onSave={(v) => saveField({ acquisition_date: v || null })}
                      type="date"
                      placeholder="Add date..."
                    />
                    <InlineRow
                      layout="stacked"
                      label="Purchase Price"
                      value={item.acquisition_price ?? ""}
                      onSave={(v) =>
                        saveField({ acquisition_price: v || null })
                      }
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Add price..."
                      formatDisplay={(v) => `$${v}`}
                    />
                    <InlineRow
                      layout="stacked"
                      label="Estimated Value"
                      value={item.estimated_value ?? ""}
                      onSave={(v) => saveField({ estimated_value: v || null })}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Add value..."
                      formatDisplay={(v) => `$${v}`}
                    />
                    <InlineRow
                      layout="stacked"
                      label="Acquisition Source"
                      value={item.acquisition_source ?? ""}
                      onSave={(v) =>
                        saveField({ acquisition_source: v || null })
                      }
                      placeholder="e.g. Auction house, Estate sale"
                      className="col-span-2"
                    />
                  </div>
                  {typeDef && typeDef.fields.length > 0 && (
                    <div>
                      <Separator className="mb-3" />
                      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        {typeDef.label} Details
                      </p>
                      <div className="space-y-1">
                        {typeDef.fields.map((field) => {
                          const raw = (
                            item.type_fields as Record<string, unknown> | null
                          )?.[field.name]
                          const currentValue =
                            typeof raw === "string" ? raw : ""
                          if (field.type === "enum") {
                            return (
                              <div
                                key={field.name}
                                className="flex items-center gap-4 py-1 text-sm"
                              >
                                <span className="text-muted-foreground w-36 shrink-0 font-medium">
                                  {field.label}
                                </span>
                                <InlineSelectBadge
                                  value={currentValue}
                                  onSave={(v) => saveTypeField(field.name, v)}
                                  options={field.options ?? []}
                                  placeholder={`+ ${field.label}`}
                                />
                              </div>
                            )
                          }
                          return (
                            <InlineRow
                              key={field.name}
                              label={field.label}
                              value={currentValue}
                              onSave={(v) => saveTypeField(field.name, v)}
                              placeholder={`Add ${field.label.toLowerCase()}...`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </DetailSection>

              <DetailSection
                title="Images"
                open={!!openSections.images}
                onOpenChange={(v) => toggleSection("images", v)}
              >
                <ItemImages itemId={item.id} images={item.images ?? []} />
              </DetailSection>

              <DetailSection
                title="Provenance"
                open={!!openSections.provenance}
                onOpenChange={(v) => toggleSection("provenance", v)}
              >
                <div className="space-y-1">
                  <InlineRow
                    label="Artist / Maker"
                    value={item.artist_maker ?? ""}
                    onSave={(v) => saveField({ artist_maker: v || null })}
                    placeholder="Add artist or maker..."
                  />
                  <InlineRow
                    label="Origin"
                    value={item.origin ?? ""}
                    onSave={(v) => saveField({ origin: v || null })}
                    placeholder="Add origin..."
                  />
                  <InlineRow
                    label="Date / Era"
                    value={item.date_era ?? ""}
                    onSave={(v) => saveField({ date_era: v || null })}
                    placeholder="Add date or era..."
                  />
                  <Separator className="my-3" />
                  <ProvenanceList
                    itemId={item.id}
                    entries={item.provenance_entries ?? []}
                  />
                </div>
              </DetailSection>

              <DetailSection
                title="Dimensions"
                open={!!openSections.dimensions}
                onOpenChange={(v) => toggleSection("dimensions", v)}
              >
                <div className="space-y-1">
                  <InlineRow
                    label="Height"
                    value={item.height_cm ?? ""}
                    onSave={(v) => saveField({ height_cm: v || null })}
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Add height..."
                    formatDisplay={(v) => `${v} cm`}
                  />
                  <InlineRow
                    label="Width"
                    value={item.width_cm ?? ""}
                    onSave={(v) => saveField({ width_cm: v || null })}
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Add width..."
                    formatDisplay={(v) => `${v} cm`}
                  />
                  <InlineRow
                    label="Depth"
                    value={item.depth_cm ?? ""}
                    onSave={(v) => saveField({ depth_cm: v || null })}
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Add depth..."
                    formatDisplay={(v) => `${v} cm`}
                  />
                  <InlineRow
                    label="Weight"
                    value={item.weight_kg ?? ""}
                    onSave={(v) => saveField({ weight_kg: v || null })}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Add weight..."
                    formatDisplay={(v) => `${v} kg`}
                  />
                  <InlineRow
                    label="Materials"
                    value={item.materials ?? ""}
                    onSave={(v) => saveField({ materials: v || null })}
                    placeholder="Add materials..."
                  />
                </div>
              </DetailSection>

              <DetailSection
                title="Marks"
                open={!!openSections.marks}
                onOpenChange={(v) => toggleSection("marks", v)}
              >
                <MarkList itemId={item.id} marks={item.marks ?? []} />
              </DetailSection>

              <DetailSection
                title="Notes"
                open={!!openSections.notes}
                onOpenChange={(v) => toggleSection("notes", v)}
              >
                <ItemNoteList itemId={item.id} notes={item.item_notes ?? []} />
              </DetailSection>
            </div>

            <DeleteItemDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              item={item}
            />
          </InlineEditFlushScope>
        ) : (
          <p className="text-muted-foreground py-12 text-center">
            Item not found.
          </p>
        )}
      </div>
    </AppLayout>
  )
}

/**
 * Renders nothing — just commits any in-progress inline edit before a
 * route change so browser back/forward or a programmatic `navigate()`
 * (which unmount fields without ever firing `onBlur`) can't silently
 * discard a draft. Must render inside the `InlineEditFlushScope` whose
 * fields it's flushing.
 */
function FlushOnNavigate({
  flushAutosave,
}: {
  flushAutosave: () => Promise<void>
}) {
  const flushPendingEdits = useFlushPendingEdits()
  useBlocker({
    shouldBlockFn: async () => {
      // Don't await this first — committing a field synchronously calls
      // useItemAutosave's save(), which merges the draft into the pending
      // patch before yielding. flushAutosave() then sees the full merged
      // patch and can drain it immediately instead of waiting out the
      // debounce window.
      const fieldsFlushed = flushPendingEdits()
      await flushAutosave()
      await fieldsFlushed
      return false
    },
    enableBeforeUnload: false,
  })
  return null
}

function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === "saving") {
    return (
      <span className="text-muted-foreground flex items-center gap-1 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    )
  }
  if (status === "saved") {
    return (
      <span className="text-muted-foreground flex items-center gap-1 text-xs">
        <Check className="h-3.5 w-3.5" />
        Saved
      </span>
    )
  }
  if (status === "error") {
    return (
      <span className="text-destructive flex items-center gap-1 text-xs">
        <AlertCircle className="h-3.5 w-3.5" />
        Save failed
      </span>
    )
  }
  return null
}

function DetailSection({
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
          className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
          {title}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pt-2 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

function ItemHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="mb-2 h-9 w-48" />
      <Skeleton className="h-5 w-32" />
    </div>
  )
}

function DeleteItemDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ItemRead
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useDeleteItemItemsItemIdDelete({
    mutation: {
      onSuccess: () => {
        if (item.collection_id) {
          queryClient.invalidateQueries({
            queryKey: getListItemsItemsGetQueryKey({
              collection_id: item.collection_id,
            }),
          })
          queryClient.invalidateQueries({
            queryKey: getGetCollectionCollectionsCollectionIdGetQueryKey(
              item.collection_id
            ),
          })
        }
        toast.success("Item deleted")
        navigate({
          to: item.collection_id ? "/collections/$collectionId" : "/",
          params: item.collection_id
            ? { collectionId: item.collection_id }
            : {},
        })
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to delete item"))
      },
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Item</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{item.name}&rdquo;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ itemId: item.id })}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ItemImages({
  itemId,
  images,
}: {
  itemId: string
  images: NonNullable<ItemRead["images"]>
}) {
  const queryClient = useQueryClient()

  const uploadMutation = useUploadItemImageItemsItemIdImagesPost({
    mutation: {
      onSuccess: () => {
        toast.success("Image uploaded")
        queryClient.invalidateQueries({
          queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
        })
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to upload image"))
      },
    },
  })

  const deleteMutation = useDeleteItemImageItemsItemIdImagesImageIdDelete({
    mutation: {
      onSuccess: () => {
        toast.success("Image deleted")
        queryClient.invalidateQueries({
          queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
        })
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to delete image"))
      },
    },
  })

  return (
    <ImageUpload
      images={images}
      maxImages={10}
      uploading={uploadMutation.isPending}
      onUpload={async (file) => {
        uploadMutation.mutate({ itemId, data: { file } })
      }}
      onDelete={async (imageId) => {
        deleteMutation.mutate({ itemId, imageId })
      }}
    />
  )
}
