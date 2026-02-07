import { Link } from "@tanstack/react-router"
import { Package } from "lucide-react"
import type { ItemRead } from "@/api/generated/types"
import { ImageCarousel } from "@/components/image-carousel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function ItemCard({ item }: { item: ItemRead }) {
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
