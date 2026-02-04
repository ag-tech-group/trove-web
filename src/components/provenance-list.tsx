import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import {
  useCreateProvenanceEntryItemsItemIdProvenancePost,
  useUpdateProvenanceEntryItemsItemIdProvenanceEntryIdPatch,
  useDeleteProvenanceEntryItemsItemIdProvenanceEntryIdDelete,
  getListProvenanceEntriesItemsItemIdProvenanceGetQueryKey,
} from "@/api/generated/hooks/provenance/provenance"
import { getGetItemItemsItemIdGetQueryKey } from "@/api/generated/hooks/items/items"
import type { ProvenanceEntryRead } from "@/api/generated/types"
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

interface ProvenanceListProps {
  itemId: string
  entries: ProvenanceEntryRead[]
}

export function ProvenanceList({ itemId, entries }: ProvenanceListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProvenanceEntryRead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProvenanceEntryRead | null>(
    null
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Ownership History</h3>
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

      {entries.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No ownership history recorded.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="border-border flex items-start justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{entry.owner_name}</p>
                {(entry.date_from || entry.date_to) && (
                  <p className="text-muted-foreground text-xs">
                    {entry.date_from}
                    {entry.date_from && entry.date_to && " — "}
                    {entry.date_to}
                  </p>
                )}
                {entry.notes && (
                  <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                    {entry.notes}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditing(entry)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setDeleteTarget(entry)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProvenanceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        itemId={itemId}
        entry={editing}
      />
      <DeleteProvenanceDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemId={itemId}
        entry={deleteTarget}
      />
    </div>
  )
}

function ProvenanceFormDialog({
  open,
  onOpenChange,
  itemId,
  entry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  entry: ProvenanceEntryRead | null
}) {
  const isEdit = !!entry
  const [ownerName, setOwnerName] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [notes, setNotes] = useState("")
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey:
        getListProvenanceEntriesItemsItemIdProvenanceGetQueryKey(itemId),
    })
    queryClient.invalidateQueries({
      queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
    })
  }

  const createMutation = useCreateProvenanceEntryItemsItemIdProvenancePost({
    mutation: {
      onSuccess: () => {
        toast.success("Provenance entry added")
        invalidate()
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(
          await getErrorMessage(err, "Failed to add provenance entry")
        )
      },
    },
  })

  const updateMutation =
    useUpdateProvenanceEntryItemsItemIdProvenanceEntryIdPatch({
      mutation: {
        onSuccess: () => {
          toast.success("Provenance entry updated")
          invalidate()
          onOpenChange(false)
        },
        onError: async (err) => {
          toast.error(
            await getErrorMessage(err, "Failed to update provenance entry")
          )
        },
      },
    })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      owner_name: ownerName,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      notes: notes || undefined,
    }
    if (isEdit && entry) {
      updateMutation.mutate({ itemId, entryId: entry.id, data })
    } else {
      createMutation.mutate({ itemId, data })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setOwnerName(entry?.owner_name ?? "")
          setDateFrom(entry?.date_from ?? "")
          setDateTo(entry?.date_to ?? "")
          setNotes(entry?.notes ?? "")
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Provenance Entry" : "Add Provenance Entry"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="prov-owner">Owner Name *</Label>
            <Input
              id="prov-owner"
              required
              maxLength={200}
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="prov-from">Date From</Label>
              <Input
                id="prov-from"
                maxLength={100}
                placeholder="e.g. circa 1850"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="prov-to">Date To</Label>
              <Input
                id="prov-to"
                maxLength={100}
                placeholder="e.g. 1920s"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-notes">Notes</Label>
            <Textarea
              id="prov-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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

function DeleteProvenanceDialog({
  open,
  onOpenChange,
  itemId,
  entry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  entry: ProvenanceEntryRead | null
}) {
  const queryClient = useQueryClient()

  const mutation = useDeleteProvenanceEntryItemsItemIdProvenanceEntryIdDelete({
    mutation: {
      onSuccess: () => {
        toast.success("Provenance entry deleted")
        queryClient.invalidateQueries({
          queryKey:
            getListProvenanceEntriesItemsItemIdProvenanceGetQueryKey(itemId),
        })
        queryClient.invalidateQueries({
          queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
        })
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(
          await getErrorMessage(err, "Failed to delete provenance entry")
        )
      },
    },
  })

  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Provenance Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the entry for &ldquo;
            {entry.owner_name}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ itemId, entryId: entry.id })}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
