import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { renderRoute } from "@/test/renderers"

describe("HomePage", () => {
  it("renders the main heading", async () => {
    await renderRoute("/")

    expect(
      screen.getByRole("heading", { name: /welcome to trove/i })
    ).toBeInTheDocument()
  })

  it("renders the navbar with sign in link", async () => {
    await renderRoute("/")

    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument()
  })
})
