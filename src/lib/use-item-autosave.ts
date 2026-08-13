import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  useUpdateItemItemsItemIdPatch,
  getGetItemItemsItemIdGetQueryKey,
  getListItemsItemsGetQueryKey,
} from "@/api/generated/hooks/items/items"
import { getGetCollectionCollectionsCollectionIdGetQueryKey } from "@/api/generated/hooks/collections/collections"
import type { ItemRead, ItemUpdate } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"

export type AutosaveStatus = "idle" | "saving" | "saved" | "error"

const DEBOUNCE_MS = 500
const SAVED_INDICATOR_MS = 2000

type TypeFieldsDelta = Record<string, string>
type PendingUpdate = Omit<ItemUpdate, "type_fields"> & {
  type_fields?: TypeFieldsDelta
}

/**
 * Coordinates commit-on-blur autosave for the item detail page.
 *
 * Field edits enqueue into one pending patch instead of firing a PATCH per
 * blur; a burst of edits within DEBOUNCE_MS collapses into a single
 * request. If edits land while a save is already in flight, they merge into
 * the next request once the current one settles, rather than racing it.
 *
 * `type_fields` is the one field the API replaces wholesale instead of
 * merging server-side (every other field is an independent scalar), so it's
 * tracked here as a delta and rebuilt from the latest committed `item` plus
 * whatever's still pending at send time — two rapid type-field edits can no
 * longer clobber each other the way they could when each field read a
 * possibly-stale `item` snapshot straight from React state.
 */
export function useItemAutosave(itemId: string, item: ItemRead | undefined) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AutosaveStatus>("idle")

  const itemRef = useRef(item)
  itemRef.current = item

  const pendingRef = useRef<PendingUpdate>({})
  const waitersRef = useRef<
    { resolve: () => void; reject: (err: unknown) => void }[]
  >([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mutation = useUpdateItemItemsItemIdPatch({
    mutation: {
      // Save failures are frequent under autosave — keep the specific
      // message below instead of doubling up with the global toast.
      meta: { skipGlobalError: true },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to update item"))
      },
    },
  })

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const drain = (): Promise<void> => {
    if (inFlightRef.current) return inFlightRef.current
    if (Object.keys(pendingRef.current).length === 0) return Promise.resolve()

    const { type_fields: typeFieldsDelta, ...rest } = pendingRef.current
    pendingRef.current = {}
    const waiters = waitersRef.current
    waitersRef.current = []

    const data: ItemUpdate = { ...rest }
    if (typeFieldsDelta !== undefined) {
      const base =
        (itemRef.current?.type_fields as Record<string, string> | null) ?? {}
      const merged = { ...base, ...typeFieldsDelta }
      const nonEmpty = Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== "")
      )
      data.type_fields = Object.keys(nonEmpty).length > 0 ? nonEmpty : null
    }

    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setStatus("saving")

    const run = mutation
      .mutateAsync({ itemId, data })
      .then((res) => {
        if (res.status !== 200) return
        queryClient.setQueryData(getGetItemItemsItemIdGetQueryKey(itemId), res)
        if (res.data.collection_id) {
          queryClient.invalidateQueries({
            queryKey: getListItemsItemsGetQueryKey({
              collection_id: res.data.collection_id,
            }),
          })
          queryClient.invalidateQueries({
            queryKey: getGetCollectionCollectionsCollectionIdGetQueryKey(
              res.data.collection_id
            ),
          })
        }
        waiters.forEach((w) => w.resolve())
        setStatus("saved")
        savedTimerRef.current = setTimeout(
          () => setStatus("idle"),
          SAVED_INDICATOR_MS
        )
      })
      .catch((err: unknown) => {
        waiters.forEach((w) => w.reject(err))
        setStatus("error")
      })
      .finally(() => {
        inFlightRef.current = null
        // More patches accumulated while this request was in flight —
        // drain them into a follow-up request instead of leaving them
        // stranded until the next unrelated edit triggers a save.
        if (Object.keys(pendingRef.current).length > 0) {
          void drain()
        }
      })

    inFlightRef.current = run
    return run
  }

  const save = (patch: PendingUpdate): Promise<void> => {
    const { type_fields: typeFieldsDelta, ...rest } = patch
    pendingRef.current = { ...pendingRef.current, ...rest }
    if (typeFieldsDelta !== undefined) {
      pendingRef.current.type_fields = {
        ...pendingRef.current.type_fields,
        ...typeFieldsDelta,
      }
    }

    // Feedback fires the moment the edit is queued (on blur), not
    // DEBOUNCE_MS later when the batched request actually goes out —
    // otherwise there's a dead half-second where nothing on screen
    // acknowledges the edit was registered. Cancel any scheduled
    // saved->idle revert too, so it can't fire mid-save and flip the
    // indicator back to idle while this edit is still pending.
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setStatus("saving")

    const promise = new Promise<void>((resolve, reject) => {
      waitersRef.current.push({ resolve, reject })
    })

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      void drain()
    }, DEBOUNCE_MS)

    return promise
  }

  const saveTypeField = (fieldName: string, value: string): Promise<void> =>
    save({ type_fields: { [fieldName]: value } })

  /** Cancels the debounce and sends whatever's pending right away. */
  const flush = (): Promise<void> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    return drain()
  }

  return { save, saveTypeField, flush, status }
}
