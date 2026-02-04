import { useState } from "react"
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
import { getGetCollectionCollectionsCollectionIdGetQueryKey } from "@/api/generated/hooks/collections/collections"
import type { ItemRead } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { AppLayout } from "@/components/app-layout"
import { ItemForm } from "@/components/item-form"
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

  const { data: itemRes, isLoading } = useGetItemItemsItemIdGet(itemId)
  const item = itemRes?.status === 200 ? itemRes.data : undefined

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

            {/* Tabs */}
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="provenance">Provenance</TabsTrigger>
                <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
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
                {!item.description &&
                  !item.location &&
                  !item.acquisition_date &&
                  !item.acquisition_price &&
                  !item.estimated_value && (
                    <EmptyTab message="No details recorded yet." />
                  )}
              </TabsContent>

              <TabsContent value="provenance" className="mt-4 space-y-3">
                <DetailRow label="Artist / Maker" value={item.artist_maker} />
                <DetailRow label="Origin" value={item.origin} />
                <DetailRow label="Date / Era" value={item.date_era} />
                <DetailRow
                  label="Provenance Notes"
                  value={item.provenance_notes}
                />
                {!item.artist_maker &&
                  !item.origin &&
                  !item.date_era &&
                  !item.provenance_notes && (
                    <EmptyTab message="No provenance information recorded." />
                  )}
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
            </Tabs>

            {/* Notes */}
            {item.notes && (
              <>
                <Separator className="my-6" />
                <div>
                  <h2 className="mb-2 text-lg font-semibold">Notes</h2>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {item.notes}
                  </p>
                </div>
              </>
            )}

            <EditItemDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              item={item}
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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ItemRead
}) {
  const queryClient = useQueryClient()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <ItemForm
          defaultValues={item}
          onSuccess={() => {
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
          }}
        />
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
