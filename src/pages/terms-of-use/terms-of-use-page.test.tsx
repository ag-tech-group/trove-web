import { describe, it, expect } from "vitest"
import { screen, within } from "@testing-library/react"
import { renderWithFileRoutes, signedOutAuth } from "@/test/renderers"

function renderTermsSignedOut() {
  return renderWithFileRoutes(<div />, {
    initialLocation: "/terms-of-use",
    routerContext: { auth: signedOutAuth },
  })
}

describe("TermsOfUsePage", () => {
  it("renders for a signed-out visitor", async () => {
    const { router } = await renderTermsSignedOut()

    expect(
      await screen.findByRole("heading", { level: 1, name: "Terms of Use" })
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/terms-of-use")
  })

  it("links every mention of the contact address to it", async () => {
    await renderTermsSignedOut()

    const links = await screen.findAllByRole("link", {
      name: "info@trovebox.io",
    })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute("href", "mailto:info@trovebox.io")
    }
  })

  it("links to both legal pages from the footer", async () => {
    await renderTermsSignedOut()

    const footer = await screen.findByRole("contentinfo")
    expect(
      within(footer).getByRole("link", { name: "Privacy Policy" })
    ).toHaveAttribute("href", "/privacy-policy")
    expect(
      within(footer).getByRole("link", { name: "Terms of Use" })
    ).toHaveAttribute("href", "/terms-of-use")
    expect(within(footer).getByText(/AG Technology Group LLC/)).toBeVisible()
  })
})
