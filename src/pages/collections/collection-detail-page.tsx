import { useState, useMemo } from "react"
import { Link, useNavigate, useParams } from "@tanstack/react-router"
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Package,
  Search,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  useGetCollectionCollectionsCollectionIdGet,
  useUpdateCollectionCollectionsCollectionIdPatch,
  useDeleteCollectionCollectionsCollectionIdDelete,
  getGetCollectionCollectionsCollectionIdGetQueryKey,
  getListCollectionsCollectionsGetQueryKey,
} from "@/api/generated/hooks/collections/collections"
import {
  useListItemsItemsGet,
  getListItemsItemsGetQueryKey,
} from "@/api/generated/hooks/items/items"
import { useListCategoriesCategoriesGet } from "@/api/generated/hooks/categories/categories"
import type { ItemRead } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { AppHeader } from "@/components/app-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ItemForm } from "@/components/item-form"

type SortKey = "name" | "date" | "value"

export function CollectionDetailPage() {
  const { collectionId } = useParams({
    from: "/collections/$collectionId",
  })
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("")
  const [sort, setSort] = useState<SortKey>("name")
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState(false)

  const { data: collectionRes, isLoading: collLoading } =
    useGetCollectionCollectionsCollectionIdGet(collectionId)
  const collection =
    collectionRes?.status === 200 ? collectionRes.data : undefined

  const { data: itemsRes, isLoading: itemsLoading } = useListItemsItemsGet({
    collection_id: collectionId,
    category: category || undefined,
    search: search || undefined,
  })

  const { data: categoriesRes } = useListCategoriesCategoriesGet()
  const categories = categoriesRes?.data ?? []

  const sortedItems = useMemo(() => {
    const items = itemsRes?.status === 200 ? itemsRes.data : []
    return [...items].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name)
      if (sort === "value") {
        const va = parseFloat(a.estimated_value ?? "0") || 0
        const vb = parseFloat(b.estimated_value ?? "0") || 0
        return vb - va
      }
      // date added
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [itemsRes, sort])

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Collections
          </Link>

          {collLoading ? (
            <CollectionHeaderSkeleton />
          ) : collection ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {collection.name}
                  </h1>
                  {collection.description && (
                    <p className="text-muted-foreground mt-1">
                      {collection.description}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-1 text-sm">
                    {collection.item_count ?? 0}{" "}
                    {(collection.item_count ?? 0) === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setAddItemOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
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
              </div>

              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                  <Input
                    placeholder="Search items..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={sort}
                  onValueChange={(v) => setSort(v as SortKey)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="date">Date Added</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Items */}
              {itemsLoading ? (
                <ItemsSkeleton />
              ) : sortedItems.length > 0 ? (
                <div className="grid gap-3">
                  {sortedItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <ItemsEmptyState onAdd={() => setAddItemOpen(true)} />
              )}

              <EditCollectionDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                collectionId={collectionId}
                defaultValues={{
                  name: collection.name,
                  description: collection.description ?? "",
                }}
              />
              <DeleteCollectionDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                collectionId={collectionId}
                collectionName={collection.name}
              />
              <AddItemDialog
                open={addItemOpen}
                onOpenChange={setAddItemOpen}
                collectionId={collectionId}
              />
            </>
          ) : (
            <p className="text-muted-foreground py-12 text-center">
              Collection not found.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ItemCard({ item }: { item: ItemRead }) {
  return (
    <Link to="/items/$itemId" params={{ itemId: item.id }} className="block">
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{item.name}</span>
              {item.category && (
                <Badge variant="secondary" className="shrink-0">
                  {item.category}
                </Badge>
              )}
              {item.condition && item.condition !== "unknown" && (
                <Badge variant="outline" className="shrink-0 capitalize">
                  {item.condition}
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
              {item.estimated_value && <span>~${item.estimated_value}</span>}
              {item.location && <span>{item.location}</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function CollectionHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="mb-2 h-9 w-48" />
      <Skeleton className="h-5 w-72" />
    </div>
  )
}

function ItemsSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="py-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ItemsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="text-muted-foreground mb-4 h-10 w-10" />
      <h2 className="mb-1 text-lg font-semibold">No items yet</h2>
      <p className="text-muted-foreground mb-6 max-w-sm text-sm">
        Add your first item to this collection.
      </p>
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  )
}

function EditCollectionDialog({
  open,
  onOpenChange,
  collectionId,
  defaultValues,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionId: string
  defaultValues: { name: string; description: string }
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(defaultValues.name)
  const [description, setDescription] = useState(defaultValues.description)

  // Sync when dialog opens with new defaults
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setName(defaultValues.name)
      setDescription(defaultValues.description)
    }
    onOpenChange(v)
  }

  const mutation = useUpdateCollectionCollectionsCollectionIdPatch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            getGetCollectionCollectionsCollectionIdGetQueryKey(collectionId),
        })
        queryClient.invalidateQueries({
          queryKey: getListCollectionsCollectionsGetQueryKey(),
        })
        toast.success("Collection updated")
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to update collection"))
      },
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      collectionId,
      data: { name, description: description || undefined },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-col-name">Name</Label>
            <Input
              id="edit-col-name"
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-col-desc">Description</Label>
            <Textarea
              id="edit-col-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteCollectionDialog({
  open,
  onOpenChange,
  collectionId,
  collectionName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionId: string
  collectionName: string
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useDeleteCollectionCollectionsCollectionIdDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListCollectionsCollectionsGetQueryKey(),
        })
        toast.success("Collection deleted")
        navigate({ to: "/" })
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to delete collection"))
      },
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Collection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{collectionName}&rdquo;? This
            action cannot be undone. All items in this collection will also be
            deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ collectionId })}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddItemDialog({
  open,
  onOpenChange,
  collectionId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionId: string
}) {
  const queryClient = useQueryClient()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
        </DialogHeader>
        <ItemForm
          collectionId={collectionId}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: getListItemsItemsGetQueryKey({
                collection_id: collectionId,
              }),
            })
            queryClient.invalidateQueries({
              queryKey:
                getGetCollectionCollectionsCollectionIdGetQueryKey(
                  collectionId
                ),
            })
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
