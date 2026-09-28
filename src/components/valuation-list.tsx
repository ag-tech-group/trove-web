import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import {
  useCreateValuationItemsItemIdValuationsPost,
  useUpdateValuationItemsItemIdValuationsValuationIdPatch,
  useDeleteValuationItemsItemIdValuationsValuationIdDelete,
  getListValuationsItemsItemIdValuationsGetQueryKey,
} from "@/api/generated/hooks/valuations/valuations"
import { getGetItemItemsItemIdGetQueryKey } from "@/api/generated/hooks/items/items"
import type { ValuationRead } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { formatMoney, sortValuations } from "@/lib/valuations"
import {
  formatPartialDate,
  joinPartialDate,
  splitPartialDate,
  type PartialDateParts,
} from "@/lib/partial-date"
import { PartialDateInput } from "@/components/partial-date-input"
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

const VALUATION_TYPES = [
  "Insurance appraisal",
  "Fair market value",
  "Auction estimate",
  "Estimate",
]

interface ValuationListProps {
  itemId: string
  valuations: ValuationRead[]
}

export function ValuationList({ itemId, valuations }: ValuationListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ValuationRead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ValuationRead | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          Appraisals and estimates over time, newest first.
        </p>
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

      {valuations.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No valuations recorded.
        </p>
      ) : (
        <div className="space-y-2">
          {sortValuations(valuations).map((valuation) => (
            <div
              key={valuation.id}
              className="border-border flex items-start justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {formatMoney(valuation.value)}
                </p>
                {(valuation.valued_on ||
                  valuation.valuation_type ||
                  valuation.appraiser) && (
                  <p className="text-muted-foreground text-xs">
                    {[
                      formatPartialDate(valuation.valued_on),
                      valuation.valuation_type,
                      valuation.appraiser,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {valuation.notes && (
                  <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                    {valuation.notes}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Edit valuation"
                  onClick={() => {
                    setEditing(valuation)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Delete valuation"
                  onClick={() => setDeleteTarget(valuation)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ValuationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        itemId={itemId}
        valuation={editing}
      />
      <DeleteValuationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemId={itemId}
        valuation={deleteTarget}
      />
    </div>
  )
}

function ValuationFormDialog({
  open,
  onOpenChange,
  itemId,
  valuation,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  valuation: ValuationRead | null
}) {
  const isEdit = !!valuation
  const [value, setValue] = useState("")
  const [date, setDate] = useState<PartialDateParts>(splitPartialDate(null))
  const [valuationType, setValuationType] = useState("")
  const [appraiser, setAppraiser] = useState("")
  const [notes, setNotes] = useState("")
  const [dateError, setDateError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getListValuationsItemsItemIdValuationsGetQueryKey(itemId),
    })
    queryClient.invalidateQueries({
      queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
    })
  }

  const createMutation = useCreateValuationItemsItemIdValuationsPost({
    mutation: {
      onSuccess: () => {
        toast.success("Valuation added")
        invalidate()
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to add valuation"))
      },
    },
  })

  const updateMutation =
    useUpdateValuationItemsItemIdValuationsValuationIdPatch({
      mutation: {
        onSuccess: () => {
          toast.success("Valuation updated")
          invalidate()
          onOpenChange(false)
        },
        onError: async (err) => {
          toast.error(await getErrorMessage(err, "Failed to update valuation"))
        },
      },
    })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const valuedOn = joinPartialDate(date)
    if (valuedOn === null) {
      setDateError("Enter a year, and a month and day that exist")
      return
    }
    setDateError(null)
    const data = {
      value,
      valued_on: valuedOn || null,
      valuation_type: valuationType || null,
      appraiser: appraiser || null,
      notes: notes || null,
    }
    if (isEdit && valuation) {
      updateMutation.mutate({ itemId, valuationId: valuation.id, data })
    } else {
      createMutation.mutate({ itemId, data })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setValue(valuation?.value ?? "")
          setDate(splitPartialDate(valuation?.valued_on))
          setValuationType(valuation?.valuation_type ?? "")
          setAppraiser(valuation?.appraiser ?? "")
          setNotes(valuation?.notes ?? "")
          setDateError(null)
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Valuation" : "Add Valuation"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="valuation-value">Value (USD) *</Label>
            <Input
              id="valuation-value"
              required
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="valuation-date-year">Date</Label>
            <PartialDateInput
              idPrefix="valuation-date"
              value={date}
              onChange={(next) => {
                setDate(next)
                setDateError(null)
              }}
              invalid={!!dateError}
            />
            {dateError && (
              <p role="alert" className="text-destructive text-xs">
                {dateError}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="valuation-type">Type</Label>
              <Input
                id="valuation-type"
                list="valuation-types"
                maxLength={100}
                placeholder="e.g. Insurance appraisal"
                value={valuationType}
                onChange={(e) => setValuationType(e.target.value)}
              />
              <datalist id="valuation-types">
                {VALUATION_TYPES.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="valuation-appraiser">Appraiser</Label>
              <Input
                id="valuation-appraiser"
                maxLength={200}
                value={appraiser}
                onChange={(e) => setAppraiser(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="valuation-notes">Notes</Label>
            <Textarea
              id="valuation-notes"
              rows={2}
              maxLength={5000}
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

function DeleteValuationDialog({
  open,
  onOpenChange,
  itemId,
  valuation,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  valuation: ValuationRead | null
}) {
  const queryClient = useQueryClient()

  const mutation = useDeleteValuationItemsItemIdValuationsValuationIdDelete({
    mutation: {
      onSuccess: () => {
        toast.success("Valuation deleted")
        queryClient.invalidateQueries({
          queryKey: getListValuationsItemsItemIdValuationsGetQueryKey(itemId),
        })
        queryClient.invalidateQueries({
          queryKey: getGetItemItemsItemIdGetQueryKey(itemId),
        })
        onOpenChange(false)
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to delete valuation"))
      },
    },
  })

  if (!valuation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Valuation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the {formatMoney(valuation.value)}{" "}
            valuation
            {valuation.valued_on
              ? ` from ${formatPartialDate(valuation.valued_on)}`
              : ""}
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({ itemId, valuationId: valuation.id })
            }
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
