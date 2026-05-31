import http from './http'

export interface EmrPatientRow {
  encounterId: number
  encounterCode: string
  patientId: number
  patientCode: string
  fullName: string
  gender: string
  dateOfBirth?: string | null
  phone?: string | null
  address?: string | null
  insuranceNumber?: string | null
  treatmentType: string
  department: string
  room?: string | null
  bed?: string | null
  attendingDoctor?: string | null
  admissionDate: string
  status: string
  diagnosis?: string | null
  chiefComplaint?: string | null
  isLocked: number | boolean
  isSummarized: number | boolean
}

export interface EmrOrder {
  id: number
  orderType: string
  name: string
  status: string
  result?: string | null
  requestedAt: string
}

export interface EmrDocument {
  id: number
  documentType: string
  title: string
  status: string
  content?: string | null
  updatedAt: string
}

export interface EmrEncounterDetail {
  encounter: Record<string, any>
  orders: EmrOrder[]
  documents: EmrDocument[]
}

export interface EmrDashboard {
  summary: {
    totalEncounters?: number
    activeEncounters?: number
    lockedRecords?: number
    summarizedRecords?: number
  }
  departments: Array<{ department: string; total: number }>
}

export interface EmrPatientFilters {
  q?: string
  status?: string
  department?: string
  treatmentType?: string
}

export const emrApi = {
  dashboard: () => http.get<EmrDashboard>('/api/v1/emr/dashboard'),
  patients: (filters?: EmrPatientFilters) => http.get<EmrPatientRow[]>('/api/v1/emr/patients', { params: filters }),
  encounter: (id: number) => http.get<EmrEncounterDetail>(`/api/v1/emr/encounters/${id}`),
  toggleLock: (id: number) => http.post(`/api/v1/emr/encounters/${id}/lock`),
  summarize: (id: number) => http.post(`/api/v1/emr/encounters/${id}/summarize`)
}
