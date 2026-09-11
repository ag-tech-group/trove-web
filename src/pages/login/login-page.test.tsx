import { describe, it, expect } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderWithFileRoutes, signedOutAuth } from "@/test/renderers"

function renderLoginSignedOut() {
  return renderWithFileRoutes(<div />, {
    initialLocation: "/login",
    routerContext: { auth: signedOutAuth },
  })
}

function findTermsNotice() {
  return screen.findByText(/by continuing, you confirm you're 18 or older/i)
}

describe("LoginPage terms notice", () => {
  it("links to both legal pages when signing in", async () => {
    await renderLoginSignedOut()

    const notice = await findTermsNotice()
    expect(
      within(notice).getByRole("link", { name: "Terms of Use" })
    ).toHaveAttribute("href", "/terms-of-use")
    expect(
      within(notice).getByRole("link", { name: "Privacy Policy" })
    ).toHaveAttribute("href", "/privacy-policy")
  })

  it("stays in place after switching to sign-up", async () => {
    const user = userEvent.setup()
    await renderLoginSignedOut()

    await user.click(await screen.findByRole("button", { name: "Sign up" }))

    expect(
      await screen.findByRole("button", { name: "Create Account" })
    ).toBeInTheDocument()
    expect(
      within(await findTermsNotice()).getByRole("link", {
        name: "Terms of Use",
      })
    ).toHaveAttribute("href", "/terms-of-use")
  })
})
