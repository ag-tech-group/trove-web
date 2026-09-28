import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ItemRead } from "@/api/generated/types"
import { renderWithFileRoutes } from "@/test/renderers"

// Generated hooks are stubbed, as in use-item-autosave.test.tsx: these tests
// cover what the page shows for an item holding every field, and what edits send.
const updateItem = vi.fn()
const updateMe = vi.fn()

const ITEM: ItemRead = {
  id: "item-1",
  user_id: "user-1",
  collection_id: null,
  name: "Tea caddy",
  reference_number: "A-01",
  description: "A small silver caddy.",
  acquisition_date: "1994",
  acquisition_method: "purchase",
  acquisition_place: "Springfield",
  acquisition_source: "Estate sale",
  acquisition_price: "1200.00",
  estimated_value: "2200.00",
  height_cm: "38.10",
  diameter_cm: "8.89",
  weight_kg: "1.200",
  type_fields: {},
  tags: [],
  marks: [],
  provenance_entries: [],
  item_notes: [],
  valuations: [
    {
      id: "v-1",
      item_id: "item-1",
      value: "2200.00",
      valued_on: "2025-08-16",
      appraiser: null,
      valuation_type: "Estimate",
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
  images: [
    {
      id: "img-1",
      item_id: "item-1",
      mark_id: null,
      filename: "front.webp",
      url: "https://images.example/front.webp",
      content_type: "image/webp",
      size_bytes: 1000,
      position: 0,
      width: 2048,
      height: 1365,
      caption: "Front view",
      description: "The lid is engraved.",
      created_at: "2026-01-01T00:00:00Z",
    },
  ],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

vi.mock("@/api/generated/hooks/items/items", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/generated/hooks/items/items")>()
  return {
    ...actual,
    useGetItemItemsItemIdGet: () => ({
      data: { status: 200, data: ITEM },
      isLoading: false,
    }),
    useUpdateItemItemsItemIdPatch: () => ({ mutateAsync: updateItem }),
    useDeleteItemItemsItemIdDelete: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  }
})

vi.mock("@/api/generated/hooks/auth/auth", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/generated/hooks/auth/auth")>()
  return {
    ...actual,
    useGetCurrentUserAuthMeGet: () => ({
      data: { status: 200, data: { preferred_units: "imperial" } },
    }),
    useUpdateCurrentUserAuthMePatch: () => ({
      mutateAsync: updateMe,
      isPending: false,
    }),
  }
})

vi.mock("@/lib/collection-types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collection-types")>()
  return {
    ...actual,
    useCollectionTypes: () => ({ types: [], isLoading: false }),
  }
})

beforeEach(() => {
  updateItem.mockReset()
  updateItem.mockImplementation(async ({ data }) => ({
    status: 200,
    data: { ...ITEM, ...data },
  }))
  updateMe.mockReset()
  updateMe.mockResolvedValue({
    status: 200,
    data: { preferred_units: "metric" },
  })
})

async function renderItem() {
  await renderWithFileRoutes(<div />, { initialLocation: "/items/item-1" })
  await screen.findByText("A-01")
}

describe("ItemDetailPage", () => {
  it("shows every field an imported item holds", async () => {
    await renderItem()

    expect(screen.getByText("Springfield")).toBeInTheDocument()
    expect(screen.getByText("1994")).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: "Acquisition Method" })
    ).toHaveTextContent("Purchase")
    expect(screen.getByText("15 in")).toBeInTheDocument()
    expect(screen.getByText("3½ in")).toBeInTheDocument()
    expect(screen.getByText("2.65 lb")).toBeInTheDocument()
    expect(screen.getByText("$2,200.00")).toBeInTheDocument()
    expect(screen.getByText("August 16, 2025 · Estimate")).toBeInTheDocument()
    expect(screen.getAllByText("Front view").length).toBeGreaterThan(0)
  })

  it("switches display units on the account", async () => {
    const user = userEvent.setup()
    await renderItem()

    await user.click(screen.getByRole("button", { name: "cm · kg" }))

    expect(updateMe).toHaveBeenCalledWith({
      data: { preferred_units: "metric" },
    })
  })

  it("narrows a year-only date to its month", async () => {
    const user = userEvent.setup()
    await renderItem()

    await user.click(screen.getByText("1994"))
    expect(screen.getByLabelText("Year")).toHaveValue("1994")
    await user.selectOptions(screen.getByLabelText("Month"), "6")
    await user.keyboard("{Enter}")

    await waitFor(
      () =>
        expect(updateItem).toHaveBeenCalledWith({
          itemId: "item-1",
          data: { acquisition_date: "1994-06" },
        }),
      { timeout: 2000 }
    )
  })

  it("saves a length typed in inches as centimetres", async () => {
    const user = userEvent.setup()
    await renderItem()

    await user.click(screen.getByText("3½ in"))
    const input = screen.getByDisplayValue("3 1/2")
    await user.clear(input)
    await user.type(input, "4{Enter}")

    await waitFor(
      () =>
        expect(updateItem).toHaveBeenCalledWith({
          itemId: "item-1",
          data: { diameter_cm: "10.16" },
        }),
      { timeout: 2000 }
    )
  })
})
