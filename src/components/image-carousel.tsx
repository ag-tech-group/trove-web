import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import type { ImageRead } from "@/api/generated/types"
import { cn } from "@/lib/utils"

interface ImageCarouselProps {
  images: ImageRead[]
  aspectRatio?: string
  showDots?: boolean
  showArrows?: boolean
  onImageClick?: (index: number) => void
  className?: string
}

export function ImageCarousel({
  images,
  aspectRatio = "aspect-video",
  showDots = false,
  showArrows = false,
  onImageClick,
  className,
}: ImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center rounded-lg",
          aspectRatio,
          className
        )}
      >
        <ImageOff className="text-muted-foreground h-8 w-8" />
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className={cn("overflow-hidden rounded-lg", className)}>
        <div className={cn("relative", aspectRatio)}>
          <img
            src={images[0].url}
            alt={images[0].filename}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              onImageClick && "cursor-pointer"
            )}
            onClick={() => onImageClick?.(0)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("group relative", className)}>
      <div ref={emblaRef} className="overflow-hidden rounded-lg">
        <div className="flex">
          {images.map((image, index) => (
            <div key={image.id} className="min-w-0 flex-[0_0_100%]">
              <div className={cn("relative", aspectRatio)}>
                <img
                  src={image.url}
                  alt={image.filename}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover",
                    onImageClick && "cursor-pointer"
                  )}
                  onClick={() => onImageClick?.(index)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {showArrows && images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            className="absolute top-1/2 left-1.5 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              emblaApi?.scrollPrev()
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              emblaApi?.scrollNext()
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      {showDots && images.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === selectedIndex
                  ? "bg-primary w-3"
                  : "bg-muted-foreground/30 w-1.5"
              )}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
