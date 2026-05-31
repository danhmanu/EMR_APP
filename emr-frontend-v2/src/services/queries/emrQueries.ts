import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emrApi, type EmrPatientFilters } from '../emr'

export const emrQueryKeys = {
  all: ['emr'] as const,
  dashboard: () => [...emrQueryKeys.all, 'dashboard'] as const,
  patients: (filters: EmrPatientFilters) => [...emrQueryKeys.all, 'patients', filters] as const,
  encounter: (id?: number | null) => [...emrQueryKeys.all, 'encounter', id] as const
}

export const useEmrDashboard = () => useQuery({
  queryKey: emrQueryKeys.dashboard(),
  queryFn: async () => (await emrApi.dashboard()).data
})

export const useEmrPatients = (filters: EmrPatientFilters) => useQuery({
  queryKey: emrQueryKeys.patients(filters),
  queryFn: async () => (await emrApi.patients(filters)).data || []
})

export const useEmrEncounter = (id?: number | null) => useQuery({
  queryKey: emrQueryKeys.encounter(id),
  queryFn: async () => id ? (await emrApi.encounter(id)).data : null,
  enabled: !!id
})

export const useToggleEmrLock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => emrApi.toggleLock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: emrQueryKeys.all })
  })
}

export const useSummarizeEmrEncounter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => emrApi.summarize(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: emrQueryKeys.all })
  })
}
