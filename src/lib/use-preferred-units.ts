import { useQueryClient } from "@tanstack/react-query"
import {
  getGetCurrentUserAuthMeGetQueryKey,
  useGetCurrentUserAuthMeGet,
  useUpdateCurrentUserAuthMePatch,
} from "@/api/generated/hooks/auth/auth"
import type { Units } from "@/lib/units"

/** The signed-in user's display units, and a way to change them. */
export function usePreferredUnits() {
  const queryClient = useQueryClient()
  const { data } = useGetCurrentUserAuthMeGet()
  const units: Units =
    (data?.status === 200 && data.data.preferred_units) || "metric"

  const mutation = useUpdateCurrentUserAuthMePatch({
    mutation: {
      onSuccess: (response) => {
        if (response.status === 200) {
          queryClient.setQueryData(
            getGetCurrentUserAuthMeGetQueryKey(),
            response
          )
        }
      },
    },
  })

  return {
    units,
    setUnits: (next: Units) =>
      mutation.mutateAsync({ data: { preferred_units: next } }),
    saving: mutation.isPending,
  }
}
