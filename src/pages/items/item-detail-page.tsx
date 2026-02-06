import { useState, useCallback } from "react"
import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { ArrowLeft, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
import type { ItemRead } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { AppLayout } from "@/components/app-layout"
import { ImageCarousel } from "@/components/image-carousel"
import { ImageLightbox } from "@/components/image-lightbox"
import { ImageUpload } from "@/components/image-upload"
import { ItemForm } from "@/components/item-form"
import { MarkList } from "@/components/mark-list"
import { ProvenanceList } from "@/components/provenance-list"
import { ItemNoteList } from "@/components/item-note-list"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

            {/* Tabs */}
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="provenance">Provenance</TabsTrigger>
                <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
                <TabsTrigger value="marks">Marks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-3">
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
                    item.acquisition_price ? `$${item.acquisition_price}` : null
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
                    <EmptyTab message="No details recorded yet." />
                  )}
              </TabsContent>

              <TabsContent value="images" className="mt-4">
                <ItemImages itemId={item.id} images={item.images ?? []} />
              </TabsContent>

              <TabsContent value="provenance" className="mt-4 space-y-3">
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
              </TabsContent>

              <TabsContent value="dimensions" className="mt-4 space-y-3">
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
                    <EmptyTab message="No dimensions recorded." />
                  )}
              </TabsContent>

              <TabsContent value="marks" className="mt-4">
                <MarkList itemId={item.id} marks={item.marks ?? []} />
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <ItemNoteList itemId={item.id} notes={item.item_notes ?? []} />
              </TabsContent>
            </Tabs>

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

function EmptyTab({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground py-6 text-center text-sm">{message}</p>
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

  const handleSuccess = useCallback(
    async (_updatedItem: ItemRead, stagedFiles: File[]) => {
      if (stagedFiles.length > 0) {
        setUploading(true)
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
        setUploading(false)
        if (failed.length > 0) {
          toast.error(`Failed to upload: ${failed.join(", ")}`)
        }
      }

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
    [item.id, item.collection_id, onOpenChange, queryClient, imageUpload]
  )

  return (
    <Dialog open={open} onOpenChange={uploading ? undefined : onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        {uploading ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Uploading images&hellip;
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
