import ky, { type Options } from "ky"

export const baseUrl = import.meta.env.VITE_API_URL || "/api"

// Callback for handling 401 responses - set this from your auth provider/router
export let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback
}

const TOKEN_KEY = "trove_auth_token"

export const api = ky.create({
  prefixUrl: baseUrl,
  timeout: 30000,
  // Retries are handled by TanStack React Query
  retry: 0,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401 && onUnauthorized) {
          onUnauthorized()
        }
      },
    ],
  },
})

export type { Options as ApiOptions }
