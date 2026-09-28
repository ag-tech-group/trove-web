import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ItemForm } from "@/components/item-form"

// Generated hooks are stubbed, as in use-item-autosave.test.tsx.
const createItem = vi.fn()

vi.mock("@/api/generated/hooks/items/items", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/generated/hooks/items/items")>()
  return {
    ...actual,
    useCreateItemItemsPost: () => ({ mutate: createItem, isPending: false }),
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
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  }
})

vi.mock("@/api/generated/hooks/tags/tags", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/generated/hooks/tags/tags")>()
  return {
    ...actual,
    useListTagsTagsGet: () => ({ data: { status: 200, data: [] } }),
  }
})

vi.mock("@/lib/collection-types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collection-types")>()
  return {
    ...actual,
    useCollectionTypes: () => ({ types: [], isLoading: false }),
  }
})

function renderForm() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ItemForm onSuccess={vi.fn()} />
    </QueryClientProvider>
  )
}

beforeEach(() => createItem.mockReset())

describe("ItemForm", () => {
  it("sends the new fields, a year-only date, and inches as centimetres", async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole("button", { name: /expand all/i }))

    await user.type(screen.getByLabelText(/name/i), "Tea caddy")
    await user.type(screen.getByLabelText(/reference no/i), "A-01")
    await user.type(screen.getByLabelText("Year"), "1994")
    await user.type(screen.getByLabelText(/^place$/i), "Springfield")
    await user.type(screen.getByLabelText(/height \(in\)/i), "15")
    await user.type(screen.getByLabelText(/diameter \(in\)/i), "3 1/2")
    await user.type(screen.getByLabelText(/weight \(lb\)/i), "2.65")
    await user.click(screen.getByRole("button", { name: /create item/i }))

    expect(createItem).toHaveBeenCalledTimes(1)
    const { data } = createItem.mock.calls[0][0]
    expect(data).toMatchObject({
      name: "Tea caddy",
      reference_number: "A-01",
      acquisition_date: "1994",
      acquisition_place: "Springfield",
      height_cm: "38.10",
      diameter_cm: "8.89",
      weight_kg: "1.202",
    })
  })

  it("refuses a measurement it can't read", async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole("button", { name: /expand all/i }))

    await user.type(screen.getByLabelText(/name/i), "Tea caddy")
    await user.type(screen.getByLabelText(/height \(in\)/i), "about a foot")
    await user.click(screen.getByRole("button", { name: /create item/i }))

    expect(screen.getByRole("alert")).toHaveTextContent(/inches/i)
    expect(createItem).not.toHaveBeenCalled()
  })
})
