import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import type { ImageRead } from "@/api/generated/types"

interface ImageLightboxProps {
  images: ImageRead[]
  open: boolean
  index: number
  onClose: () => void
}

export function ImageLightbox({
  images,
  open,
  index,
  onClose,
}: ImageLightboxProps) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={images.map((img) => ({
        src: img.url,
        alt: img.filename,
      }))}
      plugins={[Zoom, Thumbnails]}
      thumbnails={{ position: "bottom", width: 80, height: 60 }}
      zoom={{ maxZoomPixelRatio: 3 }}
    />
  )
}
