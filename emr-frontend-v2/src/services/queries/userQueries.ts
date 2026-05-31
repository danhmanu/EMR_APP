import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllRoles } from '../permissions'
import * as users from '../users'
import type { User as ApiUser } from '../../models/api'

const EMR_ONLY = (import.meta as any).env?.VITE_EMR_ONLY === 'true'

export const useUserRoles = () => useQuery<any[]>({
  queryKey: ['roles'],
  queryFn: getAllRoles
})

export const useDepartments = () => useQuery<any[]>({
  queryKey: ['departments'],
  queryFn: async () => []
})

export const useUsers = (page = 1, pageSize = 50, q = '') => useQuery<ApiUser[]>({
  queryKey: ['users', { page, pageSize, q }],
  queryFn: async () => ((await users.listUsers({ page, pageSize, q })).data || []) as ApiUser[]
})

export const useUserById = (id?: number) => useQuery<ApiUser | null>({
  queryKey: ['user', id],
  queryFn: async () => id ? ((await users.getUser(id)).data as ApiUser) : null,
  enabled: !!id
})

export const useUsersListForSelect = () => useQuery<ApiUser[]>({
  queryKey: ['users-for-select'],
  queryFn: async () => {
    const res = await users.listUsers({ page: 1, pageSize: 200 })
    return (res?.data || []) as ApiUser[]
  },
  staleTime: 5 * 60 * 1000
})

export const useMyProfile = () => useQuery<ApiUser | null>({
  queryKey: ['my-profile'],
  queryFn: async () => ((await users.getMyProfile()).data || null) as ApiUser | null,
  staleTime: 60 * 1000,
  enabled: !EMR_ONLY
})

export const useUpdateMyProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: users.MyProfilePayload) => users.updateMyProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      qc.invalidateQueries({ queryKey: ['permission-items'] })
    }
  })
}

export const useChangeMyPassword = () => {
  return useMutation({
    mutationFn: (payload: users.ChangeMyPasswordPayload) => users.changeMyPassword(payload)
  })
}

export const useToggleUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => users.toggleUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] })
  })
}

export const useUpdateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => users.updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] })
  })
}

export const useCreateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => users.createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] })
  })
}
