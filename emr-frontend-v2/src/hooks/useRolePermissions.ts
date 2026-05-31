import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '../services/api'

async function fetchRolePermissions(roleId: number): Promise<number[]> {
  const res = await fetchJson<number[]>(`/api/v1/admin/roles/${roleId}/permissions`)
  return res.data || []
}

export function useRolePermissions(roleId: number | null) {
  const { data: permissionIds = [], isLoading, error } = useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => fetchRolePermissions(roleId!),
    enabled: !!roleId,
    staleTime: 2 * 60 * 1000,
  })
  return { permissionIds, isLoading, error }
}

export function useAssignPermissionsToRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissionItemIds }: { roleId: number; permissionItemIds: number[] }) =>
      fetchJson(`/api/v1/admin/roles/${roleId}/permissions`, {
        method: 'POST',
        body: { permissionItemIds },
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['role-permissions', variables.roleId] })
    },
  })
}
