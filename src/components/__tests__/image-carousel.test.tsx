import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ImageRead } from "@/api/generated/types"
import { ImageCarousel } from "../image-carousel"

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

describe("ImageCarousel", () => {
  it("renders placeholder when images array is empty", () => {
    const { container } = render(<ImageCarousel images={[]} />)
    // lucide icons render as svg with aria-hidden; query by class instead
    expect(container.querySelector(".lucide-image-off")).toBeInTheDocument()
  })

  it("renders a single image without carousel controls", () => {
    const image = makeImage({ filename: "solo.jpg", url: "/solo.jpg" })
    render(<ImageCarousel images={[image]} showDots />)
    expect(screen.getByAltText("solo.jpg")).toBeInTheDocument()
    // No dot indicators for a single image
    expect(
      screen.queryByRole("button", { name: /go to slide/i })
    ).not.toBeInTheDocument()
  })

  it("renders dot indicators for multiple images when showDots is true", () => {
    const images = [
      makeImage({ id: "1", filename: "a.jpg" }),
      makeImage({ id: "2", filename: "b.jpg" }),
      makeImage({ id: "3", filename: "c.jpg" }),
    ]
    render(<ImageCarousel images={images} showDots />)
    const dots = screen.getAllByRole("button", { name: /go to slide/i })
    expect(dots).toHaveLength(3)
  })

  it("does not render dots when showDots is false", () => {
    const images = [makeImage({ id: "1" }), makeImage({ id: "2" })]
    render(<ImageCarousel images={images} showDots={false} />)
    expect(
      screen.queryByRole("button", { name: /go to slide/i })
    ).not.toBeInTheDocument()
  })

  it("calls onImageClick with the correct index", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const image = makeImage({ filename: "click-me.jpg", url: "/click.jpg" })
    render(<ImageCarousel images={[image]} onImageClick={onClick} />)
    await user.click(screen.getByAltText("click-me.jpg"))
    expect(onClick).toHaveBeenCalledWith(0)
  })

  it("applies custom className", () => {
    const { container } = render(
      <ImageCarousel images={[]} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })
})
