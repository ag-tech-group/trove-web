import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { renderWithFileRoutes } from "@/test/renderers"

describe("AllItemsPage", () => {
  it("renders the page heading", async () => {
    await renderWithFileRoutes(<div />, { initialLocation: "/items" })

    expect(
      await screen.findByRole("heading", { name: /all items/i })
    ).toBeInTheDocument()
  })

  it("renders the back link to collections", async () => {
    await renderWithFileRoutes(<div />, { initialLocation: "/items" })

    expect(
      await screen.findByRole("link", { name: /collections/i })
    ).toBeInTheDocument()
  })

  it("renders filter controls", async () => {
    await renderWithFileRoutes(<div />, { initialLocation: "/items" })

    expect(
      await screen.findByPlaceholderText(/search items/i)
    ).toBeInTheDocument()
    const comboboxes = screen.getAllByRole("combobox")
    expect(comboboxes.length).toBeGreaterThanOrEqual(3)
  })
})
