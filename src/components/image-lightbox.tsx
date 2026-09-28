import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import Captions from "yet-another-react-lightbox/plugins/captions"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import "yet-another-react-lightbox/plugins/captions.css"
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
        alt: img.caption ?? img.filename,
        title: img.caption ?? undefined,
        description: img.description ?? undefined,
      }))}
      plugins={[Zoom, Thumbnails, Captions]}
      thumbnails={{ position: "bottom", width: 80, height: 60 }}
      captions={{ descriptionTextAlign: "start", descriptionMaxLines: 6 }}
      zoom={{ maxZoomPixelRatio: 3 }}
    />
  )
}
