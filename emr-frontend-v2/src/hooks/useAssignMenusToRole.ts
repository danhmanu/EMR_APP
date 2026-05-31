import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '../services/api'

export interface AssignMenuRequest {
  menuItemIds: number[]
}

async function assignMenusToRole(roleId: number, request: AssignMenuRequest) {
  const response = await fetchJson(`/api/v1/admin/roles/${roleId}/menu`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return response.data
}

export function useAssignMenusToRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, menuItemIds }: { roleId: number; menuItemIds: number[] }) =>
      assignMenusToRole(roleId, { menuItemIds }),
    onSuccess: () => {
      // Invalidate menu queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['menu'] })
    },
  })
}
