import { http, HttpResponse, type HttpHandler } from "msw"

/**
 * Import generated MSW handlers after running `pnpm generate-api`
 * Example:
 *  import { getDefaultMock } from "@/api/generated/hooks/default/default.msw"
 *  import { getRacersMock } from "@/api/generated/hooks/racers/racers.msw"
 *  export const handlers: HttpHandler[] = [...getDefaultMock(), ...getRacersMock()]
 */

export const handlers: HttpHandler[] = [
  // Return 401 for /auth/me by default (unauthenticated)
  http.get("*/auth/me", () => HttpResponse.json(null, { status: 401 })),
]
