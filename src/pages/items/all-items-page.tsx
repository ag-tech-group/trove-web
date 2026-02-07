import { useState, useMemo } from "react"
import { Link } from "@tanstack/react-router"
import { ArrowLeft, Package, Search, ChevronsUpDown } from "lucide-react"
import { useListItemsItemsGet } from "@/api/generated/hooks/items/items"
import { useListCollectionsCollectionsGet } from "@/api/generated/hooks/collections/collections"
import { useListTagsTagsGet } from "@/api/generated/hooks/tags/tags"
import type { ItemRead } from "@/api/generated/types"
import { AppLayout } from "@/components/app-layout"
import { ImageCarousel } from "@/components/image-carousel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"

type SortKey = "name" | "date" | "value"

export function AllItemsPage() {
  const [search, setSearch] = useState("")
  const [tag, setTag] = useState<string>("")
  const [sort, setSort] = useState<SortKey>("name")
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [collectionsOpen, setCollectionsOpen] = useState(false)

  const { data: itemsRes, isLoading: itemsLoading } = useListItemsItemsGet({
    tag: tag || undefined,
    search: search || undefined,
  })

  const { data: collectionsRes } = useListCollectionsCollectionsGet()
  const collections = collectionsRes?.data ?? []

  const { data: tagsRes } = useListTagsTagsGet()
  const tags = tagsRes?.data ?? []

  const filteredAndSorted = useMemo(() => {
    const items = itemsRes?.status === 200 ? itemsRes.data : []

    const filtered =
      selectedCollections.length > 0
        ? items.filter(
            (item) =>
              item.collection_id &&
              selectedCollections.includes(item.collection_id)
          )
        : items

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name)
      if (sort === "value") {
        const va = parseFloat(a.estimated_value ?? "0") || 0
        const vb = parseFloat(b.estimated_value ?? "0") || 0
        return vb - va
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [itemsRes, sort, selectedCollections])

  const totalValue = useMemo(() => {
    return filteredAndSorted.reduce(
      (sum, item) => sum + (parseFloat(item.estimated_value ?? "0") || 0),
      0
    )
  }, [filteredAndSorted])

  const toggleCollection = (id: string) => {
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Collections
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">All Items</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {filteredAndSorted.length}{" "}
            {filteredAndSorted.length === 1 ? "item" : "items"}
            {totalValue > 0 && (
              <>
                {" "}
                &middot; $
                {totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                est. value
              </>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Search items..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <span className="text-muted-foreground text-xs">Tag</span>
            <Select
              value={tag || "all"}
              onValueChange={(v) => setTag(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <span className="text-muted-foreground text-xs">Collection</span>
            <Popover open={collectionsOpen} onOpenChange={setCollectionsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={collectionsOpen}
                  className="w-[200px] justify-between font-normal"
                >
                  <span className="truncate">
                    {selectedCollections.length === 0
                      ? "All collections"
                      : selectedCollections.length === 1
                        ? (collections.find(
                            (c) => c.id === selectedCollections[0]
                          )?.name ?? "1 selected")
                        : `${selectedCollections.length} selected`}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search collections..." />
                  <CommandList>
                    <CommandEmpty>No collections found.</CommandEmpty>
                    <CommandGroup>
                      {collections.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => toggleCollection(c.id)}
                        >
                          <Checkbox
                            checked={selectedCollections.includes(c.id)}
                            className="mr-2"
                          />
                          <span className="truncate">{c.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-1">
            <span className="text-muted-foreground text-xs">Sort</span>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Date Added</SelectItem>
                <SelectItem value="value">Value</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Items */}
        {itemsLoading ? (
          <ItemsSkeleton />
        ) : filteredAndSorted.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <ItemsEmptyState />
        )}
      </div>
    </AppLayout>
  )
}

function ItemCard({ item }: { item: ItemRead }) {
  const images = item.images ?? []
  return (
    <Link to="/items/$itemId" params={{ itemId: item.id }} className="block">
      <Card className="hover:border-primary/40 h-full overflow-hidden transition-colors">
        {images.length > 0 ? (
          <ImageCarousel
            images={images}
            aspectRatio="aspect-[4/3]"
            showDots
            showArrows
            className="rounded-none"
          />
        ) : (
          <div className="bg-muted flex aspect-[4/3] items-center justify-center">
            <Package className="text-muted-foreground h-8 w-8" />
          </div>
        )}
        <CardContent className="p-3">
          <p className="truncate font-medium">{item.name}</p>
          {item.description && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
              {item.description}
            </p>
          )}
          <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
            {item.estimated_value && (
              <span>
                $
                {parseFloat(item.estimated_value).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
            {item.estimated_value && item.created_at && <span>&middot;</span>}
            <span>
              {new Date(item.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {item.collection_name && (
              <Badge variant="default" className="text-xs">
                {item.collection_name}
              </Badge>
            )}
            {item.tags?.map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs">
                {t.name}
              </Badge>
            ))}
            {item.condition && item.condition !== "unknown" && (
              <Badge variant="outline" className="text-xs capitalize">
                {item.condition}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ItemsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <CardContent className="p-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ItemsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="text-muted-foreground mb-4 h-10 w-10" />
      <h2 className="mb-1 text-lg font-semibold">No items found</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Try adjusting your filters or add items to your collections.
      </p>
    </div>
  )
}
