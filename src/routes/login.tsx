import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"
import { LoginPage } from "@/pages/login/login-page"

const loginSearchSchema = z.object({
  error: z.string().optional(),
})

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/" })
    }
  },
  component: LoginPage,
})
