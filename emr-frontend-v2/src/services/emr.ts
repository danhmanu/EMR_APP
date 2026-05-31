import http from './http'

export interface EmrInpatientMedicalRecord {
  idLine?: string | null
  patId?: string | null
  idLink?: string | null
  fullName?: string | null
  yearBr?: number | null
  monthBr?: number | null
  dayBr?: number | null
  sex?: number | null
  emeCode?: string | null
  medicalCode?: string | null
  idObject?: number | null
  objectCode?: string | null
  objectName?: string | null
  bhi?: string | null
  statusName?: string | null
  doctorId?: string | null
  doctorName?: string | null
  isEmergency?: number | null
  typRec?: number | null
  address?: string | null
  type?: string | null
  medicalRecordId?: string | null
  transferInfoId?: string | null
  priceList?: number | null
  hospitalizationCode?: string | null
  hospCode?: string | null
  medexaReceiveId?: number | null
  medexalReceiveId?: number | null
  profileTemplateTypeId?: number | null
  statusTransferId?: number | null
  statusTransferCode?: string | null
  nameMedicalType?: string | null
  status?: number | null
  hospitalizationTypeId?: number | null
  statusProfileId?: number | null
  statusProfileCode?: string | null
  hospitalizationDate?: string | null
  disfrohosDate?: string | null
  totalTreatmentDay?: number | null
  icdIn?: string | null
  icdOut?: string | null
  noHi?: string | null
  strDay?: string | null
  endDay?: string | null
  rateHi?: number | null
  hospHiName?: string | null
  hospHiCode?: string | null
  idLinePatientHi?: string | null
  managStatusId?: number | null
  phone?: string | null
  destroyDate?: string | null
  reasonCancel?: string | null
  hosNum?: string | null
  regDate?: string | null
  bebName?: string | null
  sourcePayAttachId?: number | null
  sourcePayAttachName?: string | null
  priceListName?: string | null
  recordCode?: string | null
  patientNote?: string | null
  roomId?: number | null
  roomName?: string | null
  bedId?: number | null
  bedName?: string | null
  reason?: string | null
  siterf?: number | null
  userCr?: string | null
  timeCr?: string | null
  userUp?: string | null
  timeUp?: string | null
  computer?: string | null
  isModify?: string | null
  extraFields?: Record<string, unknown> | null
}

export interface EmrPatientRow {
  encounterId: number | string
  encounterCode: string
  patientId: number | string
  hospCode: string
  patientCode: string
  fullName: string
  gender: string
  dateOfBirth?: string | null
  phone?: string | null
  address?: string | null
  insuranceNumber?: string | null
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
  raw: EmrInpatientMedicalRecord
}

export interface EmrPatientFilters {
  departmentId?: number
  medexalReceiveId?: number
  dateFrom?: string
  dateTo?: string
  typeList?: 'ListPatientIn' | 'ListPatientOut'
  offset?: number
  limit?: number
  requestKey?: number
}

export const emrApi = {
  patients: (filters?: EmrPatientFilters) => {
    const { requestKey, ...params } = filters || {}
    return http.get<EmrPatientRow[]>('/api/v1/emr/patients', { params })
  }
}
