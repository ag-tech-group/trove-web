import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ValuationRead } from "@/api/generated/types"
import { ValuationList } from "@/components/valuation-list"

// The generated mutation hooks are stubbed, as in use-item-autosave.test.tsx,
// so these tests cover what the list shows and what it sends.
const createMutate = vi.fn()
const updateMutate = vi.fn()
const deleteMutate = vi.fn()

vi.mock(
  "@/api/generated/hooks/valuations/valuations",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/api/generated/hooks/valuations/valuations")
      >()
    return {
      ...actual,
      useCreateValuationItemsItemIdValuationsPost: () => ({
        mutate: createMutate,
        isPending: false,
      }),
      useUpdateValuationItemsItemIdValuationsValuationIdPatch: () => ({
        mutate: updateMutate,
        isPending: false,
      }),
      useDeleteValuationItemsItemIdValuationsValuationIdDelete: () => ({
        mutate: deleteMutate,
        isPending: false,
      }),
    }
  }
)

const VALUATIONS: ValuationRead[] = [
  {
    id: "v-old",
    item_id: "item-1",
    value: "900.00",
    valued_on: "2019",
    appraiser: null,
    valuation_type: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "v-new",
    item_id: "item-1",
    value: "2200.00",
    valued_on: "2025-08-16",
    appraiser: "Regional appraiser",
    valuation_type: "Estimate",
    notes: "For insurance",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

function renderList(valuations = VALUATIONS) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ValuationList itemId="item-1" valuations={valuations} />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  createMutate.mockReset()
  updateMutate.mockReset()
  deleteMutate.mockReset()
})

describe("ValuationList", () => {
  it("lists valuations newest first with their date, type and appraiser", () => {
    renderList()

    const values = screen.getAllByText(/^\$/).map((el) => el.textContent)
    expect(values).toEqual(["$2,200.00", "$900.00"])
    expect(
      screen.getByText("August 16, 2025 · Estimate · Regional appraiser")
    ).toBeInTheDocument()
    expect(screen.getByText("2019")).toBeInTheDocument()
    expect(screen.getByText("For insurance")).toBeInTheDocument()
  })

  it("adds a valuation dated to the month", async () => {
    const user = userEvent.setup()
    renderList([])

    await user.click(screen.getByRole("button", { name: /add/i }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText(/value/i), "250")
    await user.type(within(dialog).getByLabelText("Year"), "2021")
    await user.selectOptions(within(dialog).getByLabelText("Month"), "3")
    await user.type(within(dialog).getByLabelText(/type/i), "Auction estimate")
    await user.click(within(dialog).getByRole("button", { name: "Add" }))

    expect(createMutate).toHaveBeenCalledWith({
      itemId: "item-1",
      data: {
        value: "250",
        valued_on: "2021-03",
        valuation_type: "Auction estimate",
        appraiser: null,
        notes: null,
      },
    })
  })

  it("refuses a date that isn't real", async () => {
    const user = userEvent.setup()
    renderList([])

    await user.click(screen.getByRole("button", { name: /add/i }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText(/value/i), "250")
    await user.type(within(dialog).getByLabelText("Year"), "21")
    await user.click(within(dialog).getByRole("button", { name: "Add" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      /a year/i
    )
    expect(createMutate).not.toHaveBeenCalled()
  })

  it("deletes a valuation after confirming", async () => {
    const user = userEvent.setup()
    renderList()

    await user.click(
      screen.getAllByRole("button", { name: "Delete valuation" })[0]
    )
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    expect(deleteMutate).toHaveBeenCalledWith({
      itemId: "item-1",
      valuationId: "v-new",
    })
  })
})
