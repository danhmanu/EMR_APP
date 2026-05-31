import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '../services/api'

export interface Role {
  id: number
  name: string
  displayName?: string
}

async function fetchAllRoles(): Promise<Role[]> {
  const response = await fetchJson<Role[]>('/api/v1/admin/roles')
  return response.data || []
}

export function useRoles() {
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: () => fetchAllRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    roles,
    isLoading,
    error,
  }
}
