import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '../services/api'

export interface PermissionItem {
  id: number
  code: string
  description?: string
}

async function fetchPermissionItems(): Promise<PermissionItem[]> {
  const res = await fetchJson<PermissionItem[]>('/api/v1/admin/permission-items')
  return res.data || []
}

export function usePermissionItems() {
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['permission-items'],
    queryFn: fetchPermissionItems,
    staleTime: 5 * 60 * 1000,
  })
  return { items, isLoading, error }
}

export function useCreatePermissionItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { code: string; description?: string }) =>
      fetchJson('/api/v1/admin/permission-items', { method: 'POST', body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permission-items'] }),
  })
}

export function useUpdatePermissionItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; code?: string; description?: string }) =>
      fetchJson(`/api/v1/admin/permission-items/${id}`, { method: 'PUT', body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permission-items'] }),
  })
}

export function useDeletePermissionItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      fetchJson(`/api/v1/admin/permission-items/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permission-items'] }),
  })
}
