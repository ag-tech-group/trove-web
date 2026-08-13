import { useState, useRef } from "react"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import {
  useListTagsTagsGet,
  useCreateTagTagsPost,
  getListTagsTagsGetQueryKey,
} from "@/api/generated/hooks/tags/tags"
import type { TagRead } from "@/api/generated/types"
import { getErrorMessage } from "@/lib/api-errors"
import { Badge } from "@/components/ui/badge"

export function TagInput({
  selectedTagIds,
  onChange,
  autoFocus,
}: {
  selectedTagIds: string[]
  onChange: (ids: string[]) => void
  autoFocus?: boolean
}) {
  const [inputValue, setInputValue] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: tagsRes } = useListTagsTagsGet()
  const allTags = tagsRes?.data ?? []

  const createTagMutation = useCreateTagTagsPost({
    mutation: {
      onSuccess: (res) => {
        if (res.status === 201) {
          queryClient.invalidateQueries({
            queryKey: getListTagsTagsGetQueryKey(),
          })
          onChange([...selectedTagIds, res.data.id])
          setInputValue("")
        }
      },
      onError: async (err) => {
        toast.error(await getErrorMessage(err, "Failed to create tag"))
      },
    },
  })

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id))
  const filtered = allTags.filter(
    (t) =>
      !selectedTagIds.includes(t.id) &&
      t.name.toLowerCase().includes(inputValue.toLowerCase())
  )
  const exactMatch = allTags.some(
    (t) => t.name.toLowerCase() === inputValue.trim().toLowerCase()
  )
  const canCreate = inputValue.trim().length > 0 && !exactMatch

  const toggleTag = (tag: TagRead) => {
    if (selectedTagIds.includes(tag.id)) {
      onChange(selectedTagIds.filter((id) => id !== tag.id))
    } else {
      onChange([...selectedTagIds, tag.id])
      setInputValue("")
    }
  }

  const removeTag = (tagId: string) => {
    onChange(selectedTagIds.filter((id) => id !== tagId))
  }

  const handleCreateTag = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    createTagMutation.mutate({ data: { name: trimmed } })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Backspace" &&
      inputValue === "" &&
      selectedTagIds.length > 0
    ) {
      onChange(selectedTagIds.slice(0, -1))
    }
    if (e.key === "Enter") {
      e.preventDefault()
      if (filtered.length > 0) {
        toggleTag(filtered[0])
      } else if (canCreate) {
        handleCreateTag()
      }
    }
  }

  return (
    <div className="relative">
      <div
        className="border-input focus-within:border-ring focus-within:ring-ring/50 flex min-h-9 flex-wrap items-center gap-1 rounded-md border bg-transparent px-2 py-1 text-sm focus-within:ring-[3px]"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-0.5 pr-1">
            {tag.name}
            <button
              type="button"
              className="hover:text-foreground ml-0.5 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag.id)
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          className="placeholder:text-muted-foreground min-w-[60px] flex-1 bg-transparent py-0.5 outline-none"
          placeholder={selectedTags.length === 0 ? "Add tags..." : ""}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => {
            // Delay to allow click on dropdown items
            setTimeout(() => setDropdownOpen(false), 150)
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {dropdownOpen && (filtered.length > 0 || canCreate) && (
        <div className="border-border bg-popover text-popover-foreground absolute top-full z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-md border shadow-md">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="hover:bg-accent hover:text-accent-foreground w-full px-3 py-1.5 text-left text-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                toggleTag(tag)
                inputRef.current?.focus()
              }}
            >
              {tag.name}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                handleCreateTag()
                inputRef.current?.focus()
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create &ldquo;{inputValue.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
