import { useState, useCallback } from "react"
import { Link, useNavigate, useParams } from "@tanstack/react-router"
import {
  ArrowLeft,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
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
import { useCreateMarkItemsItemIdMarksPost } from "@/api/generated/hooks/marks/marks"
import { useUploadMarkImageItemsItemIdMarksMarkIdImagesPost } from "@/api/generated/hooks/mark-images/mark-images"
import { useCreateItemNoteItemsItemIdNotesPost } from "@/api/generated/hooks/notes/notes"
import {
  getGetCollectionCollectionsCollectionIdGetQueryKey,
  useGetCollectionCollectionsCollectionIdGet,
} from "@/api/generated/hooks/collections/collections"
import { useCollectionTypes, findCollectionType } from "@/lib/collection-types"
import type { ItemRead } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { AppLayout } from "@/components/app-layout"
import { ImageCarousel } from "@/components/image-carousel"
import { ImageLightbox } from "@/components/image-lightbox"
import { ImageUpload } from "@/components/image-upload"
import {
  ItemForm,
  type StagedMark,
  type StagedNote,
} from "@/components/item-form"
import { MarkList } from "@/components/mark-list"
import { ProvenanceList } from "@/components/provenance-list"
import { ItemNoteList } from "@/components/item-note-list"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ItemDetailPage() {
  const { itemId } = useParams({ from: "/items/$itemId" })
  const [editOpen, setEditOpen] = useState(false)
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
          <>
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {item.name}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.tags?.map((t) => (
                    <Badge key={t.id} variant="secondary">
                      {t.name}
                    </Badge>
                  ))}
                  {item.condition && item.condition !== "unknown" && (
                    <Badge variant="outline" className="capitalize">
                      {item.condition}
                    </Badge>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive-foreground"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                <div className="space-y-3">
                  {item.description && (
                    <DetailRow label="Description" value={item.description} />
                  )}
                  <DetailRow label="Location" value={item.location} />
                  <DetailRow
                    label="Acquisition Date"
                    value={item.acquisition_date}
                  />
                  <DetailRow
                    label="Purchase Price"
                    value={
                      item.acquisition_price
                        ? `$${item.acquisition_price}`
                        : null
                    }
                  />
                  <DetailRow
                    label="Estimated Value"
                    value={
                      item.estimated_value ? `$${item.estimated_value}` : null
                    }
                  />
                  <DetailRow
                    label="Acquisition Source"
                    value={item.acquisition_source}
                  />
                  {item.type_fields && typeDef && typeDef.fields.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {typeDef.label} Details
                      </p>
                      {typeDef.fields.map((field) => {
                        const raw = (
                          item.type_fields as Record<string, unknown>
                        )?.[field.name]
                        if (!raw) return null
                        let display = String(raw)
                        if (field.type === "enum" && field.options) {
                          const opt = field.options.find((o) => o.value === raw)
                          if (opt) display = opt.label
                        }
                        return (
                          <DetailRow
                            key={field.name}
                            label={field.label}
                            value={display}
                          />
                        )
                      })}
                    </>
                  )}
                  {!item.description &&
                    !item.location &&
                    !item.acquisition_date &&
                    !item.acquisition_price &&
                    !item.estimated_value &&
                    !item.acquisition_source &&
                    !item.type_fields && (
                      <EmptySection message="No details recorded yet." />
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
                <div className="space-y-3">
                  <DetailRow label="Artist / Maker" value={item.artist_maker} />
                  <DetailRow label="Origin" value={item.origin} />
                  <DetailRow label="Date / Era" value={item.date_era} />
                  {(item.artist_maker || item.origin || item.date_era) && (
                    <Separator className="my-3" />
                  )}
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
                <div className="space-y-3">
                  <DetailRow
                    label="Height"
                    value={item.height_cm ? `${item.height_cm} cm` : null}
                  />
                  <DetailRow
                    label="Width"
                    value={item.width_cm ? `${item.width_cm} cm` : null}
                  />
                  <DetailRow
                    label="Depth"
                    value={item.depth_cm ? `${item.depth_cm} cm` : null}
                  />
                  <DetailRow
                    label="Weight"
                    value={item.weight_kg ? `${item.weight_kg} kg` : null}
                  />
                  <DetailRow label="Materials" value={item.materials} />
                  {!item.height_cm &&
                    !item.width_cm &&
                    !item.depth_cm &&
                    !item.weight_kg &&
                    !item.materials && (
                      <EmptySection message="No dimensions recorded." />
                    )}
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

            <EditItemDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              item={item}
              collectionType={collectionType}
            />
            <DeleteItemDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              item={item}
            />
          </>
        ) : (
          <p className="text-muted-foreground py-12 text-center">
            Item not found.
          </p>
        )}
      </div>
    </AppLayout>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex gap-4 text-sm">
      <span className="text-muted-foreground w-36 shrink-0 font-medium">
        {label}
      </span>
      <span className="whitespace-pre-wrap">{value}</span>
    </div>
  )
}

function EmptySection({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground py-6 text-center text-sm">{message}</p>
  )
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

function EditItemDialog({
  open,
  onOpenChange,
  item,
  collectionType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ItemRead
  collectionType?: string
}) {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const imageUpload = useUploadItemImageItemsItemIdImagesPost()
  const createMark = useCreateMarkItemsItemIdMarksPost()
  const markImageUpload = useUploadMarkImageItemsItemIdMarksMarkIdImagesPost()
  const createNote = useCreateItemNoteItemsItemIdNotesPost()

  const handleSuccess = useCallback(
    async (
      _updatedItem: ItemRead,
      stagedFiles: File[],
      stagedMarks: StagedMark[],
      stagedNotes: StagedNote[]
    ) => {
      const hasUploads =
        stagedFiles.length > 0 ||
        stagedMarks.length > 0 ||
        stagedNotes.length > 0
      if (hasUploads) setUploading(true)

      // 1. Upload item images
      if (stagedFiles.length > 0) {
        const failed: string[] = []
        for (const file of stagedFiles) {
          try {
            await imageUpload.mutateAsync({
              itemId: item.id,
              data: { file },
            })
          } catch {
            failed.push(file.name)
          }
        }
        if (failed.length > 0) {
          toast.error(`Failed to upload: ${failed.join(", ")}`)
        }
      }

      // 2. Create marks + upload mark images
      for (const sm of stagedMarks) {
        try {
          const markRes = await createMark.mutateAsync({
            itemId: item.id,
            data: {
              title: sm.title || undefined,
              description: sm.description || undefined,
            },
          })
          if (markRes.status === 201 && sm.files.length > 0) {
            for (const file of sm.files) {
              try {
                await markImageUpload.mutateAsync({
                  itemId: item.id,
                  markId: markRes.data.id,
                  data: { file },
                })
              } catch {
                toast.error(`Failed to upload mark image: ${file.name}`)
              }
            }
          }
        } catch {
          toast.error(`Failed to create mark: ${sm.title || "Untitled"}`)
        }
      }

      // 3. Create notes
      for (const sn of stagedNotes) {
        try {
          await createNote.mutateAsync({
            itemId: item.id,
            data: {
              title: sn.title || undefined,
              body: sn.body,
            },
          })
        } catch {
          toast.error(`Failed to create note: ${sn.title || "Untitled"}`)
        }
      }

      if (hasUploads) setUploading(false)

      queryClient.invalidateQueries({
        queryKey: getGetItemItemsItemIdGetQueryKey(item.id),
      })
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
      onOpenChange(false)
    },
    [
      item.id,
      item.collection_id,
      onOpenChange,
      queryClient,
      imageUpload,
      createMark,
      markImageUpload,
      createNote,
    ]
  )

  return (
    <Dialog open={open} onOpenChange={uploading ? undefined : onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        {uploading ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Saving&hellip;
          </p>
        ) : (
          <ItemForm
            defaultValues={item}
            collectionType={collectionType}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
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
