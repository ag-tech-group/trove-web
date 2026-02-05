import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import {
  useCreateMarkItemsItemIdMarksPost,
  useUpdateMarkItemsItemIdMarksMarkIdPatch,
  useDeleteMarkItemsItemIdMarksMarkIdDelete,
  getListMarksItemsItemIdMarksGetQueryKey,
} from "@/api/generated/hooks/marks/marks"
import {
  useUploadMarkImageItemsItemIdMarksMarkIdImagesPost,
  useDeleteMarkImageItemsItemIdMarksMarkIdImagesImageIdDelete,
} from "@/api/generated/hooks/mark-images/mark-images"
import { getGetItemItemsItemIdGetQueryKey } from "@/api/generated/hooks/items/items"
import type { MarkRead } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { ImageUpload } from "@/components/image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

interface MarkListProps {
  itemId: string
  marks: MarkRead[]
}

export function MarkList({ itemId, marks }: MarkListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MarkRead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MarkRead | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Marks & Inscriptions</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {marks.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No marks recorded.
        </p>
      ) : (
        <div className="space-y-2">
          {marks.map((mark) => (
            <div
              key={mark.id}
              className="border-border flex items-start justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0 flex-1">
                {mark.title && (
                  <p className="text-sm font-medium">{mark.title}</p>
                )}
                {mark.description && (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {mark.description}
                  </p>
                )}
                {!mark.title && !mark.description && (
                  <p className="text-muted-foreground text-sm italic">
                    No details
                  </p>
                )}
                {mark.images && mark.images.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {mark.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt={img.filename}
                        className="h-12 w-12 rounded border object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditing(mark)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setDeleteTarget(mark)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MarkFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        itemId={itemId}
        mark={editing}
      />
      <DeleteMarkDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemId={itemId}
        mark={deleteTarget}
      />
    </div>
  )
}

function MarkFormDialog({
  open,
  onOpenChange,
  itemId,
  mark,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  mark: MarkRead | null
}) {
  const isEdit = !!mark
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getListMarksItemsItemIdMarksGetQueryKey(itemId),
    })
    queryClient.invalidateQueries({
      queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
    })
  }

  const createMutation = useCreateMarkItemsItemIdMarksPost({
    mutation: {
      onSuccess: () => {
        toast.success("Mark added")
        invalidate()
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to add mark"))
      },
    },
  })

  const updateMutation = useUpdateMarkItemsItemIdMarksMarkIdPatch({
    mutation: {
      onSuccess: () => {
        toast.success("Mark updated")
        invalidate()
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to update mark"))
      },
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      title: title || undefined,
      description: description || undefined,
    }
    if (isEdit && mark) {
      updateMutation.mutate({ itemId, markId: mark.id, data })
    } else {
      createMutation.mutate({ itemId, data })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setTitle(mark?.title ?? "")
          setDescription(mark?.description ?? "")
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Mark" : "Add Mark"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="mark-title">Title</Label>
            <Input
              id="mark-title"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mark-desc">Description</Label>
            <Textarea
              id="mark-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
        {isEdit && mark && (
          <>
            <Separator />
            <MarkImages itemId={itemId} mark={mark} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DeleteMarkDialog({
  open,
  onOpenChange,
  itemId,
  mark,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  mark: MarkRead | null
}) {
  const queryClient = useQueryClient()

  const mutation = useDeleteMarkItemsItemIdMarksMarkIdDelete({
    mutation: {
      onSuccess: () => {
        toast.success("Mark deleted")
        queryClient.invalidateQueries({
          queryKey: getListMarksItemsItemIdMarksGetQueryKey(itemId),
        })
        queryClient.invalidateQueries({
          queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
        })
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to delete mark"))
      },
    },
  })

  if (!mark) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Mark</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this mark? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ itemId, markId: mark.id })}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MarkImages({ itemId, mark }: { itemId: string; mark: MarkRead }) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getListMarksItemsItemIdMarksGetQueryKey(itemId),
    })
    queryClient.invalidateQueries({
      queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
    })
  }

  const uploadMutation = useUploadMarkImageItemsItemIdMarksMarkIdImagesPost({
    mutation: {
      onSuccess: () => {
        toast.success("Image uploaded")
        invalidate()
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to upload image"))
      },
    },
  })

  const deleteMutation =
    useDeleteMarkImageItemsItemIdMarksMarkIdImagesImageIdDelete({
      mutation: {
        onSuccess: () => {
          toast.success("Image deleted")
          invalidate()
        },
        onError: async (err) => {
          toast.error(await getErrorMessage(err, "Failed to delete image"))
        },
      },
    })

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Images</p>
      <ImageUpload
        images={mark.images ?? []}
        maxImages={3}
        uploading={uploadMutation.isPending}
        onUpload={async (file) => {
          uploadMutation.mutate({
            itemId,
            markId: mark.id,
            data: { file },
          })
        }}
        onDelete={async (imageId) => {
          deleteMutation.mutate({ itemId, markId: mark.id, imageId })
        }}
      />
    </div>
  )
}
