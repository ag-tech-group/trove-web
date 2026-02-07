import { createFileRoute } from "@tanstack/react-router"
import { AllItemsPage } from "@/pages/items/all-items-page"

export const Route = createFileRoute("/items/")({
  component: AllItemsPage,
})
