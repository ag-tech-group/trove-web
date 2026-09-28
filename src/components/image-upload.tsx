import { useRef, useState } from "react"
import { ImagePlus, Loader2, Pencil, Trash2, X } from "lucide-react"
import type { ImageRead } from "@/api/generated/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  /** When given, each image can have its caption and description edited. */
  onUpdate?: (
    imageId: string,
    data: { caption: string | null; description: string | null }
  ) => Promise<void>
  uploading?: boolean
}

export function ImageUpload({
  images,
  maxImages,
  onUpload,
  onDelete,
  onUpdate,
  uploading = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<ImageRead | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [previewImage, setPreviewImage] = useState<ImageRead | null>(null)
  const [editTarget, setEditTarget] = useState<ImageRead | null>(null)
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
            <div key={image.id} className="min-w-0 space-y-1">
              <div className="group relative aspect-square overflow-hidden rounded-md border">
                <img
                  src={image.url}
                  alt={image.caption ?? image.filename}
                  className="h-full w-full cursor-pointer object-cover"
                  onClick={() => setPreviewImage(image)}
                />
                {onUpdate && (
                  <button
                    type="button"
                    aria-label="Edit caption"
                    className="absolute top-1 left-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 focus-visible:opacity-100"
                    onClick={() => setEditTarget(image)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Delete image"
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 focus-visible:opacity-100"
                  onClick={() => setDeleteTarget(image)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {image.caption && (
                <p
                  className="text-muted-foreground truncate text-xs"
                  title={image.caption}
                >
                  {image.caption}
                </p>
              )}
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
            <DialogTitle>
              {previewImage?.caption || previewImage?.filename}
            </DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage.url}
              alt={previewImage.caption ?? previewImage.filename}
              className="max-h-[60vh] w-full rounded-md object-contain"
            />
          )}
          {previewImage?.description && (
            <p className="text-muted-foreground max-h-40 overflow-y-auto text-sm whitespace-pre-wrap">
              {previewImage.description}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {onUpdate && (
        <ImageTextDialog
          image={editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          onSave={onUpdate}
        />
      )}

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

function ImageTextDialog({
  image,
  onOpenChange,
  onSave,
}: {
  image: ImageRead | null
  onOpenChange: (open: boolean) => void
  onSave: NonNullable<ImageUploadProps["onUpdate"]>
}) {
  const [caption, setCaption] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [shownFor, setShownFor] = useState<string | null>(null)

  // Reset the fields each time the dialog opens on an image.
  if (image && shownFor !== image.id) {
    setShownFor(image.id)
    setCaption(image.caption ?? "")
    setDescription(image.description ?? "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image) return
    setSaving(true)
    try {
      await onSave(image.id, {
        caption: caption.trim() || null,
        description: description.trim() || null,
      })
      onOpenChange(false)
      setShownFor(null)
    } catch {
      // error toast surfaced by the caller; keep the dialog open
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={!!image}
      onOpenChange={(open) => {
        if (!open) setShownFor(null)
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {image && (
            <img
              src={image.url}
              alt={image.caption ?? image.filename}
              className="max-h-48 w-full rounded-md object-contain"
            />
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="image-caption">Caption</Label>
            <Input
              id="image-caption"
              maxLength={500}
              placeholder="e.g. Maker's mark on the base"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="image-description">Description</Label>
            <Textarea
              id="image-description"
              rows={5}
              maxLength={20000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
