import { createFileRoute } from "@tanstack/react-router"
import { PrivacyPolicyPage } from "@/pages/privacy-policy/privacy-policy-page"

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
})
