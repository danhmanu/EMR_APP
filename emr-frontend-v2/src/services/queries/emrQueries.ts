import { useQuery } from '@tanstack/react-query'
import { getDepartments, getRooms } from '../departments'
import { emrApi, type EmrPatientFilters } from '../emr'

export const emrQueryKeys = {
  all: ['emr'] as const,
  departments: () => [...emrQueryKeys.all, 'departments'] as const,
  rooms: () => [...emrQueryKeys.all, 'rooms'] as const,
  patients: (filters: EmrPatientFilters) => [...emrQueryKeys.all, 'patients', filters] as const
}

export const useEmrPatients = (filters: EmrPatientFilters) => useQuery({
  queryKey: emrQueryKeys.patients(filters),
  queryFn: async () => (await emrApi.patients(filters)).data || [],
  enabled: Boolean(filters.medexalReceiveId)
})

export const useEmrDepartments = () => useQuery({
  queryKey: emrQueryKeys.departments(),
  queryFn: () => getDepartments(0, 1000),
  staleTime: 5 * 60 * 1000
})

export const useEmrRooms = () => useQuery({
  queryKey: emrQueryKeys.rooms(),
  queryFn: () => getRooms(0, 1000),
  staleTime: 5 * 60 * 1000
})
