import { createFileRoute } from "@tanstack/react-router"
import { CollectionDetailPage } from "@/pages/collections/collection-detail-page"

export const Route = createFileRoute("/collections/$collectionId")({
  component: CollectionDetailPage,
})
