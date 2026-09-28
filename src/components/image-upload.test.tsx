import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ImageRead } from "@/api/generated/types"
import { ImageUpload } from "@/components/image-upload"

const IMAGE: ImageRead = {
  id: "img-1",
  item_id: "item-1",
  mark_id: null,
  filename: "front.webp",
  url: "https://images.example/front.webp",
  content_type: "image/webp",
  size_bytes: 1000,
  position: 0,
  caption: "Front view",
  description: null,
  created_at: "2026-01-01T00:00:00Z",
}

describe("ImageUpload", () => {
  it("shows each photo's caption", () => {
    render(
      <ImageUpload
        images={[IMAGE]}
        maxImages={10}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText("Front view")).toBeInTheDocument()
  })

  it("edits a caption and description when it can", async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    render(
      <ImageUpload
        images={[IMAGE]}
        maxImages={10}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={onUpdate}
      />
    )

    await user.click(screen.getByRole("button", { name: "Edit caption" }))
    const dialog = await screen.findByRole("dialog")
    const caption = within(dialog).getByLabelText("Caption")
    await user.clear(caption)
    await user.type(caption, "Lid, open")
    await user.type(
      within(dialog).getByLabelText("Description"),
      "Engraved inside."
    )
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(onUpdate).toHaveBeenCalledWith("img-1", {
      caption: "Lid, open",
      description: "Engraved inside.",
    })
  })

  it("offers no caption editing without onUpdate", () => {
    render(
      <ImageUpload
        images={[IMAGE]}
        maxImages={10}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(
      screen.queryByRole("button", { name: "Edit caption" })
    ).not.toBeInTheDocument()
  })
})
