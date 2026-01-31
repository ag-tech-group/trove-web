import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Plus, Boxes } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  useListCollectionsCollectionsGet,
  useCreateCollectionCollectionsPost,
  getListCollectionsCollectionsGetQueryKey,
} from "@/api/generated/hooks/collections/collections"
import { getErrorMessage } from "@/lib/api-errors"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CollectionsDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading } = useListCollectionsCollectionsGet()
  const collections = data?.data

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My Collections</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </div>

        {isLoading ? (
          <CollectionsSkeleton />
        ) : collections && collections.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.id}
                to="/collections/$collectionId"
                params={{ collectionId: c.id }}
                className="block"
              >
                <Card className="hover:border-primary/40 h-full transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{c.name}</CardTitle>
                      <Badge variant="secondary">
                        {c.item_count ?? 0}{" "}
                        {(c.item_count ?? 0) === 1 ? "item" : "items"}
                      </Badge>
                    </div>
                  </CardHeader>
                  {c.description && (
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {c.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState onAdd={() => setDialogOpen(true)} />
        )}
      </div>

      <CreateCollectionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppLayout>
  )
}

function CollectionsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Boxes className="text-muted-foreground mb-4 h-12 w-12" />
      <h2 className="mb-1 text-xl font-semibold">No collections yet</h2>
      <p className="text-muted-foreground mb-6 max-w-sm text-sm">
        Create your first collection to start organizing and tracking your
        treasured items.
      </p>
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        New Collection
      </Button>
    </div>
  )
}

function CreateCollectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const mutation = useCreateCollectionCollectionsPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListCollectionsCollectionsGetQueryKey(),
        })
        toast.success("Collection created")
        reset()
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to create collection"))
      },
    },
  })

  const reset = () => {
    setName("")
    setDescription("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      data: { name, description: description || undefined },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="col-name">Name</Label>
            <Input
              id="col-name"
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="col-desc">Description (optional)</Label>
            <Textarea
              id="col-desc"
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
              {mutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
