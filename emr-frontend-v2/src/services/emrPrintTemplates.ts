import { fetchJson } from './api'
import type { ApiResponse } from '../types/models'
import { unwrapApiData } from '../utils/apiResponse'

export type EmrPrintTemplate = {
  id: number
  code: string
  name: string
  description?: string | null
  templateGroup: string
  version: number
  paperSize: string
  orientation: string
  layoutJson: string
  sampleDataJson?: string | null
  isActive: boolean
  isDefault: boolean
  createdAt?: string
  updatedAt?: string
}

export type EmrPrintTemplatePayload = Omit<EmrPrintTemplate, 'id' | 'createdAt' | 'updatedAt'>

function normalizeTemplate(raw: any): EmrPrintTemplate {
  return {
    id: Number(raw?.id ?? raw?.Id ?? 0),
    code: String(raw?.code ?? raw?.Code ?? ''),
    name: String(raw?.name ?? raw?.Name ?? ''),
    description: raw?.description ?? raw?.Description ?? null,
    templateGroup: String(raw?.templateGroup ?? raw?.TemplateGroup ?? 'EMR'),
    version: Number(raw?.version ?? raw?.Version ?? 1),
    paperSize: String(raw?.paperSize ?? raw?.PaperSize ?? 'A4'),
    orientation: String(raw?.orientation ?? raw?.Orientation ?? 'Portrait'),
    layoutJson: String(raw?.layoutJson ?? raw?.LayoutJson ?? '{}'),
    sampleDataJson: raw?.sampleDataJson ?? raw?.SampleDataJson ?? null,
    isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? true),
    isDefault: Boolean(raw?.isDefault ?? raw?.IsDefault ?? false),
    createdAt: raw?.createdAt ?? raw?.CreatedAt,
    updatedAt: raw?.updatedAt ?? raw?.UpdatedAt
  }
}

function unwrapTemplates(response: ApiResponse<unknown>): EmrPrintTemplate[] {
  const payload = unwrapApiData<unknown>(response)
  const rows = Array.isArray(payload) ? payload : []
  return rows.map(normalizeTemplate).filter(item => item.id && item.code)
}

function unwrapTemplate(response: ApiResponse<unknown>): EmrPrintTemplate | null {
  const payload = unwrapApiData<unknown>(response)
  return payload ? normalizeTemplate(payload) : null
}

export async function listEmrPrintTemplates() {
  const response = await fetchJson<unknown>('/api/v1/emr/print-templates')
  return unwrapTemplates(response)
}

export async function getEmrPrintTemplate(id: number) {
  const response = await fetchJson<unknown>(`/api/v1/emr/print-templates/${id}`)
  return unwrapTemplate(response)
}

export async function createEmrPrintTemplate(payload: EmrPrintTemplatePayload) {
  const response = await fetchJson<unknown>('/api/v1/emr/print-templates', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return { ...response, data: response.success ? unwrapTemplate(response) : null } as ApiResponse<EmrPrintTemplate>
}

export async function updateEmrPrintTemplate(id: number, payload: EmrPrintTemplatePayload) {
  const response = await fetchJson<unknown>(`/api/v1/emr/print-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  return { ...response, data: response.success ? unwrapTemplate(response) : null } as ApiResponse<EmrPrintTemplate>
}

export async function deleteEmrPrintTemplate(id: number) {
  return fetchJson<unknown>(`/api/v1/emr/print-templates/${id}`, { method: 'DELETE' })
}
