import { createFileRoute } from "@tanstack/react-router"
import { ItemDetailPage } from "@/pages/items/item-detail-page"

export const Route = createFileRoute("/items/$itemId")({
  component: ItemDetailPage,
})
