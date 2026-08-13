import { describe, it, expect, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  InlineText,
  InlineRow,
  InlineTagsBadges,
  InlineEditFlushScope,
  useFlushPendingEdits,
} from "./inline-edit"

describe("InlineText", () => {
  it("commits the trimmed draft on blur", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<InlineText value="Vintage Chair" onSave={onSave} />)

    await user.click(screen.getByText("Vintage Chair"))
    const input = screen.getByDisplayValue("Vintage Chair")
    await user.clear(input)
    await user.type(input, "  Antique Chair  ")
    await user.tab()

    expect(onSave).toHaveBeenCalledWith("Antique Chair")
  })

  it("reverts the draft on Escape without saving", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<InlineText value="Vintage Chair" onSave={onSave} />)

    await user.click(screen.getByText("Vintage Chair"))
    const input = screen.getByDisplayValue("Vintage Chair")
    await user.clear(input)
    await user.type(input, "Something else")
    await user.keyboard("{Escape}")

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText("Vintage Chair")).toBeInTheDocument()
  })

  it("stays in edit mode with the draft intact when the save fails", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error("network error"))
    render(<InlineText value="Vintage Chair" onSave={onSave} />)

    await user.click(screen.getByText("Vintage Chair"))
    const input = screen.getByDisplayValue("Vintage Chair")
    await user.clear(input)
    await user.type(input, "New Name")
    await user.tab()

    expect(onSave).toHaveBeenCalledWith("New Name")
    // Still editing, draft preserved — nothing reverted, no unhandled rejection.
    expect(screen.getByDisplayValue("New Name")).toBeInTheDocument()
  })

  it("rejects an empty value when required and keeps editing open", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<InlineText value="Vintage Chair" onSave={onSave} required />)

    await user.click(screen.getByText("Vintage Chair"))
    const input = screen.getByDisplayValue("Vintage Chair")
    await user.clear(input)
    await user.tab()

    expect(onSave).not.toHaveBeenCalled()
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent(/required/i)
  })

  it("labels the read-mode button when ariaLabel is given", () => {
    render(
      <InlineText
        value="Vintage Chair"
        onSave={vi.fn()}
        ariaLabel="Edit name"
      />
    )
    expect(
      screen.getByRole("button", { name: "Edit name" })
    ).toBeInTheDocument()
  })

  it("commits an in-progress draft when flushed via InlineEditFlushScope", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    let flush: () => Promise<void> = async () => {}
    function Harness() {
      flush = useFlushPendingEdits()
      return <InlineText value="Vintage Chair" onSave={onSave} />
    }
    render(
      <InlineEditFlushScope>
        <Harness />
      </InlineEditFlushScope>
    )

    await user.click(screen.getByText("Vintage Chair"))
    const input = screen.getByDisplayValue("Vintage Chair")
    await user.clear(input)
    await user.type(input, "Antique Chair")

    // No blur fired — simulates navigating away without leaving the field.
    expect(onSave).not.toHaveBeenCalled()
    await act(() => flush())
    expect(onSave).toHaveBeenCalledWith("Antique Chair")
  })
})

describe("InlineTagsBadges", () => {
  it("labels the read-mode button", () => {
    render(<InlineTagsBadges tags={[]} onSave={vi.fn()} />)
    expect(
      screen.getByRole("button", { name: "Edit tags" })
    ).toBeInTheDocument()
  })
})

describe("InlineRow", () => {
  it("commits the draft on blur", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<InlineRow label="Location" value="Attic" onSave={onSave} />)

    await user.click(screen.getByText("Attic"))
    const input = screen.getByDisplayValue("Attic")
    await user.clear(input)
    await user.type(input, "Basement")
    await user.tab()

    expect(onSave).toHaveBeenCalledWith("Basement")
  })

  it("reverts the draft on Escape without saving", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<InlineRow label="Location" value="Attic" onSave={onSave} />)

    await user.click(screen.getByText("Attic"))
    const input = screen.getByDisplayValue("Attic")
    await user.clear(input)
    await user.type(input, "Basement")
    await user.keyboard("{Escape}")

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText("Attic")).toBeInTheDocument()
  })

  it("associates the label with the field via htmlFor/id", () => {
    render(<InlineRow label="Location" value="Attic" onSave={vi.fn()} />)
    expect(screen.getByText("Location").tagName).toBe("LABEL")
    expect(screen.getByLabelText("Location")).toBeInTheDocument()
  })
})
