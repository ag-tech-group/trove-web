import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import type { ImageRead } from "@/api/generated/types"
import { ImageLightbox } from "../image-lightbox"

function makeImage(overrides: Partial<ImageRead> = {}): ImageRead {
  return {
    id: crypto.randomUUID(),
    item_id: null,
    mark_id: null,
    filename: "photo.jpg",
    url: "https://example.com/photo.jpg",
    content_type: "image/jpeg",
    size_bytes: 1024,
    position: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe("ImageLightbox", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(
      <ImageLightbox
        images={[makeImage()]}
        open={false}
        index={0}
        onClose={vi.fn()}
      />
    )
    // YARL does not render the lightbox overlay when closed
    expect(container.querySelector(".yarl__root")).not.toBeInTheDocument()
  })

  it("renders the lightbox when open is true", () => {
    render(
      <ImageLightbox
        images={[makeImage({ url: "/test.jpg", filename: "test.jpg" })]}
        open={true}
        index={0}
        onClose={vi.fn()}
      />
    )
    expect(document.querySelector(".yarl__root")).toBeInTheDocument()
  })

  it("renders a close button when open", () => {
    render(
      <ImageLightbox
        images={[makeImage()]}
        open={true}
        index={0}
        onClose={vi.fn()}
      />
    )
    const closeButton = document.querySelector('button[aria-label="Close"]')
    expect(closeButton).toBeInTheDocument()
  })

  it("renders with multiple images", () => {
    const images = [
      makeImage({ id: "1", url: "/a.jpg" }),
      makeImage({ id: "2", url: "/b.jpg" }),
      makeImage({ id: "3", url: "/c.jpg" }),
    ]
    render(
      <ImageLightbox images={images} open={true} index={1} onClose={vi.fn()} />
    )
    expect(document.querySelector(".yarl__root")).toBeInTheDocument()
  })
})
