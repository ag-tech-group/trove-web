import { useRef, useEffect, useState } from "react"
import { ImagePlus, X } from "lucide-react"
import { Label } from "@/components/ui/label"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

interface ImagePickerProps {
  files: File[]
  onChange: (files: File[]) => void
  maxImages?: number
}

export function ImagePicker({
  files,
  onChange,
  maxImages = 10,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Map<File, string>>(new Map())

  // Generate data URL previews for new files
  useEffect(() => {
    let cancelled = false
    const currentFiles = new Set(files)

    // Remove stale entries
    setPreviews((prev) => {
      const next = new Map(prev)
      let changed = false
      for (const key of next.keys()) {
        if (!currentFiles.has(key)) {
          next.delete(key)
          changed = true
        }
      }
      return changed ? next : prev
    })

    // Read any files that don't have previews yet
    const newFiles = files.filter((f) => !previews.has(f))
    if (newFiles.length > 0) {
      Promise.all(
        newFiles.map((f) => readAsDataUrl(f).then((url) => [f, url] as const))
      ).then((results) => {
        if (cancelled) return
        setPreviews((prev) => {
          const next = new Map(prev)
          for (const [file, url] of results) {
            next.set(file, url)
          }
          return next
        })
      })
    }

    return () => {
      cancelled = true
    }
  }, [files]) // eslint-disable-line react-hooks/exhaustive-deps

  const canAdd = files.length < maxImages

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Copy into a real array BEFORE clearing the input — e.target.files
    // is a live FileList that gets emptied when the input value is reset.
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return

    // Reset input so the same file can be re-selected
    e.target.value = ""

    const newFiles: File[] = []
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only JPEG, PNG, and WebP images are allowed.")
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("File is too large. Maximum size is 10 MB.")
        return
      }
      newFiles.push(file)
    }

    const remaining = maxImages - files.length
    const toAdd = newFiles.slice(0, remaining)
    if (toAdd.length > 0) {
      setError(null)
      onChange([...files, ...toAdd])
    }
  }

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="grid gap-1.5">
      <Label>Images</Label>

      {/* Thumbnail grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {files.map((file, i) => {
            const dataUrl = previews.get(file)
            return (
              <div
                key={`${file.name}-${file.size}-${i}`}
                className="relative aspect-square overflow-hidden rounded-md border"
              >
                {dataUrl ? (
                  <img
                    src={dataUrl}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center">
                    <ImagePlus className="text-muted-foreground h-4 w-4 animate-pulse" />
                  </div>
                )}
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  onClick={() => removeFile(i)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add button */}
      {canAdd && (
        <button
          type="button"
          className="border-border hover:border-foreground/25 hover:bg-muted/50 flex w-full items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground">Add image</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      {files.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {files.length} / {maxImages} images selected
        </p>
      )}
    </div>
  )
}
