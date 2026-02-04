import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import {
  useCreateItemNoteItemsItemIdNotesPost,
  useUpdateItemNoteItemsItemIdNotesNoteIdPatch,
  useDeleteItemNoteItemsItemIdNotesNoteIdDelete,
  getListItemNotesItemsItemIdNotesGetQueryKey,
} from "@/api/generated/hooks/notes/notes"
import { getGetItemItemsItemIdGetQueryKey } from "@/api/generated/hooks/items/items"
import type { ItemNoteRead } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

interface ItemNoteListProps {
  itemId: string
  notes: ItemNoteRead[]
}

export function ItemNoteList({ itemId, notes }: ItemNoteListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ItemNoteRead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ItemNoteRead | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Notes</h3>
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

      {notes.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No notes recorded.
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border-border flex items-start justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0 flex-1">
                {note.title && (
                  <p className="text-sm font-medium">{note.title}</p>
                )}
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {note.body}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditing(note)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setDeleteTarget(note)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        itemId={itemId}
        note={editing}
      />
      <DeleteNoteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemId={itemId}
        note={deleteTarget}
      />
    </div>
  )
}

function NoteFormDialog({
  open,
  onOpenChange,
  itemId,
  note,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  note: ItemNoteRead | null
}) {
  const isEdit = !!note
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getListItemNotesItemsItemIdNotesGetQueryKey(itemId),
    })
    queryClient.invalidateQueries({
      queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
    })
  }

  const createMutation = useCreateItemNoteItemsItemIdNotesPost({
    mutation: {
      onSuccess: () => {
        toast.success("Note added")
        invalidate()
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to add note"))
      },
    },
  })

  const updateMutation = useUpdateItemNoteItemsItemIdNotesNoteIdPatch({
    mutation: {
      onSuccess: () => {
        toast.success("Note updated")
        invalidate()
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to update note"))
      },
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      title: title || undefined,
      body,
    }
    if (isEdit && note) {
      updateMutation.mutate({ itemId, noteId: note.id, data })
    } else {
      createMutation.mutate({ itemId, data })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setTitle(note?.title ?? "")
          setBody(note?.body ?? "")
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Note" : "Add Note"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="note-body">Body *</Label>
            <Textarea
              id="note-body"
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteNoteDialog({
  open,
  onOpenChange,
  itemId,
  note,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  note: ItemNoteRead | null
}) {
  const queryClient = useQueryClient()

  const mutation = useDeleteItemNoteItemsItemIdNotesNoteIdDelete({
    mutation: {
      onSuccess: () => {
        toast.success("Note deleted")
        queryClient.invalidateQueries({
          queryKey: getListItemNotesItemsItemIdNotesGetQueryKey(itemId),
        })
        queryClient.invalidateQueries({
          queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
        })
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to delete note"))
      },
    },
  })

  if (!note) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Note</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this note? This action cannot be
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
            onClick={() => mutation.mutate({ itemId, noteId: note.id })}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
