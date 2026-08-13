import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { getGetItemItemsItemIdGetQueryKey } from "@/api/generated/hooks/items/items"
import { useItemAutosave } from "./use-item-autosave"
import type { ItemRead, ItemUpdate } from "@/api/generated/types"

// Stubbed below the real react-query `useMutation` layer (which is
// orval-generated and not ours to test) so these tests exercise only
// useItemAutosave's own debounce/merge/drain/status logic — and to avoid a
// pre-existing Node 26 + undici incompatibility with mocking ky requests
// through MSW in this repo (unrelated to this hook).
const mutateAsync = vi.fn()

vi.mock("@/api/generated/hooks/items/items", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/generated/hooks/items/items")>()
  return {
    ...actual,
    useUpdateItemItemsItemIdPatch: () => ({ mutateAsync }),
  }
})

const ITEM_ID = "item-1"

function makeItem(overrides: Partial<ItemRead> = {}): ItemRead {
  return {
    id: ITEM_ID,
    user_id: "user-1",
    collection_id: null,
    name: "Vintage Chair",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    type_fields: {},
    ...overrides,
  }
}

function okResponse(data: ItemUpdate) {
  return { status: 200 as const, data: { ...makeItem(), ...data } }
}

let queryClient: QueryClient
function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  // Only fake setTimeout/clearTimeout — faking everything else (the
  // default preset) breaks ky/undici's AbortSignal handling.
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
  mutateAsync.mockReset()
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useItemAutosave", () => {
  it("debounces a burst of saves into a single merged request", async () => {
    mutateAsync.mockImplementation(async ({ data }: { data: ItemUpdate }) =>
      okResponse(data)
    )
    const { result } = renderHook(() => useItemAutosave(ITEM_ID, makeItem()), {
      wrapper,
    })

    act(() => {
      void result.current.save({ name: "New Name" })
      void result.current.save({ location: "Attic" })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(mutateAsync).toHaveBeenCalledTimes(1)
    expect(mutateAsync).toHaveBeenCalledWith({
      itemId: ITEM_ID,
      data: { name: "New Name", location: "Attic" },
    })
  })

  it("queues edits that land while a save is in flight as one follow-up request", async () => {
    const calls: ItemUpdate[] = []
    let resolveFirst!: () => void

    mutateAsync.mockImplementation(({ data }: { data: ItemUpdate }) => {
      calls.push(data)
      if (calls.length === 1) {
        return new Promise((resolve) => {
          resolveFirst = () => resolve(okResponse(data))
        })
      }
      return Promise.resolve(okResponse(data))
    })

    const { result } = renderHook(() => useItemAutosave(ITEM_ID, makeItem()), {
      wrapper,
    })

    act(() => {
      void result.current.save({ name: "New Name" })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(calls).toHaveLength(1)

    act(() => {
      void result.current.save({ location: "Attic" })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    // Second save's debounce fired, but drain() must not overlap the
    // in-flight request — it stays queued instead of firing concurrently.
    expect(calls).toHaveLength(1)

    await act(async () => {
      resolveFirst()
      await vi.advanceTimersByTimeAsync(0)
    })

    // Once the first request settles, the queued edit drains immediately
    // as its own request — no second debounce wait required.
    expect(calls).toHaveLength(2)
    expect(calls[1]).toEqual({ location: "Attic" })
  })

  it("merges concurrent type-field edits into one request without losing either", async () => {
    mutateAsync.mockImplementation(async ({ data }: { data: ItemUpdate }) =>
      okResponse(data)
    )
    const { result } = renderHook(
      () => useItemAutosave(ITEM_ID, makeItem({ type_fields: {} })),
      { wrapper }
    )

    act(() => {
      void result.current.saveTypeField("mint_status", "used")
      void result.current.saveTypeField("denomination", "1d")
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(mutateAsync).toHaveBeenCalledWith({
      itemId: ITEM_ID,
      data: { type_fields: { mint_status: "used", denomination: "1d" } },
    })
  })

  it("rebuilds type_fields from the latest item instead of a stale snapshot", async () => {
    const calls: ItemUpdate[] = []
    mutateAsync.mockImplementation(({ data }: { data: ItemUpdate }) => {
      calls.push(data)
      return Promise.resolve(okResponse(data))
    })

    const { result, rerender } = renderHook(
      ({ item }: { item: ItemRead }) => useItemAutosave(ITEM_ID, item),
      { wrapper, initialProps: { item: makeItem({ type_fields: {} }) } }
    )

    act(() => {
      void result.current.saveTypeField("mint_status", "used")
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(calls[0]).toEqual({ type_fields: { mint_status: "used" } })

    // Simulate the page re-rendering with the item the first save
    // persisted, then a second, independent type-field edit.
    rerender({ item: makeItem({ type_fields: { mint_status: "used" } }) })

    act(() => {
      void result.current.saveTypeField("denomination", "1d")
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(calls[1]).toEqual({
      type_fields: { mint_status: "used", denomination: "1d" },
    })
  })

  it("flush() cancels the debounce and sends immediately", async () => {
    mutateAsync.mockImplementation(async ({ data }: { data: ItemUpdate }) =>
      okResponse(data)
    )
    const { result } = renderHook(() => useItemAutosave(ITEM_ID, makeItem()), {
      wrapper,
    })

    act(() => {
      void result.current.save({ name: "New Name" })
    })
    expect(mutateAsync).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.flush()
    })

    expect(mutateAsync).toHaveBeenCalledWith({
      itemId: ITEM_ID,
      data: { name: "New Name" },
    })
  })

  it("seeds the item query cache from the mutation response on success", async () => {
    mutateAsync.mockImplementation(async ({ data }: { data: ItemUpdate }) =>
      okResponse(data)
    )
    const { result } = renderHook(() => useItemAutosave(ITEM_ID, makeItem()), {
      wrapper,
    })

    act(() => {
      void result.current.save({ name: "New Name" })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    const cached = queryClient.getQueryData(
      getGetItemItemsItemIdGetQueryKey(ITEM_ID)
    )
    expect(cached).toEqual(okResponse({ name: "New Name" }))
  })

  it("tracks status through saving -> saved -> idle, and error on failure", async () => {
    mutateAsync.mockImplementation(async ({ data }: { data: ItemUpdate }) =>
      okResponse(data)
    )
    const { result } = renderHook(() => useItemAutosave(ITEM_ID, makeItem()), {
      wrapper,
    })
    expect(result.current.status).toBe("idle")

    act(() => {
      void result.current.save({ name: "New Name" })
    })
    // "saving" shows the moment the edit is queued — not 500ms later
    // when the debounced request actually goes out.
    expect(result.current.status).toBe("saving")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(result.current.status).toBe("saved")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(result.current.status).toBe("idle")

    mutateAsync.mockRejectedValueOnce(new Error("network error"))
    act(() => {
      void result.current.save({ name: "Another Name" }).catch(() => {})
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(result.current.status).toBe("error")
  })

  it("cancels the saved->idle revert if a new edit starts while it's pending", async () => {
    mutateAsync.mockImplementation(async ({ data }: { data: ItemUpdate }) =>
      okResponse(data)
    )
    const { result } = renderHook(() => useItemAutosave(ITEM_ID, makeItem()), {
      wrapper,
    })

    // t=0: first save. t=500: request resolves -> "saved", arming a
    // saved->idle revert for t=2500.
    act(() => {
      void result.current.save({ name: "New Name" })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(result.current.status).toBe("saved")

    // t=900: edit again, 1s into the 2s revert window. This must cancel
    // the t=2500 timer above — otherwise it fires later and incorrectly
    // flips the indicator to idle mid-save.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })
    act(() => {
      void result.current.save({ location: "Attic" })
    })
    expect(result.current.status).toBe("saving")

    // t=1400: second request resolves -> "saved", arming its own revert
    // for t=3400.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(result.current.status).toBe("saved")

    // t=2500: the stale first-save timer would have fired here if it
    // hadn't been cancelled. Status must still be "saved" (from the
    // second save's own timer, due at t=3400), not "idle".
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100)
    })
    expect(result.current.status).toBe("saved")

    // t=3400: the second save's own revert fires right on schedule.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    expect(result.current.status).toBe("idle")
  })
})
