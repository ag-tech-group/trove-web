import { useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2, X } from "lucide-react"
import type { ImageRead } from "@/api/generated/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

interface ImageUploadProps {
  images: ImageRead[]
  maxImages: number
  onUpload: (file: File) => Promise<void>
  onDelete: (imageId: string) => Promise<void>
  uploading?: boolean
}

export function ImageUpload({
  images,
  maxImages,
  onUpload,
  onDelete,
  uploading = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<ImageRead | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [previewImage, setPreviewImage] = useState<ImageRead | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canUpload = images.length < maxImages && !uploading

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-selected
    e.target.value = ""

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed.")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 10 MB.")
      return
    }

    setError(null)
    await onUpload(file)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await onDelete(deleteTarget.id)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-md border"
            >
              <img
                src={image.url}
                alt={image.filename}
                className="h-full w-full cursor-pointer object-cover"
                onClick={() => setPreviewImage(image)}
              />
              <button
                type="button"
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                onClick={() => setDeleteTarget(image)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canUpload && (
        <button
          type="button"
          className="border-border hover:border-foreground/25 hover:bg-muted/50 flex w-full items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="text-muted-foreground h-4 w-4" />
          )}
          <span className="text-muted-foreground">
            {uploading ? "Uploading..." : "Add image"}
          </span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Validation error */}
      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Image count */}
      {images.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {images.length} / {maxImages} images
        </p>
      )}

      {/* Preview dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="sm:max-w-2xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>{previewImage?.filename}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage.url}
              alt={previewImage.filename}
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
