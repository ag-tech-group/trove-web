import { createFileRoute } from "@tanstack/react-router"
import { TermsOfUsePage } from "@/pages/terms-of-use/terms-of-use-page"

export const Route = createFileRoute("/terms-of-use")({
  component: TermsOfUsePage,
})
