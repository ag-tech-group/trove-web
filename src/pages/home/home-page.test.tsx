import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { renderRoute } from "@/test/renderers"

describe("HomePage", () => {
  it("renders the hero heading for signed-out users", async () => {
    await renderRoute("/")

    expect(
      await screen.findByRole("heading", {
        name: /your personal collection manager/i,
      })
    ).toBeInTheDocument()
  })

  it("renders the navbar with sign in link", async () => {
    await renderRoute("/")

    expect(
      await screen.findByRole("link", { name: /sign in/i })
    ).toBeInTheDocument()
  })
})
