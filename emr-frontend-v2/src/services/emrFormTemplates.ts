import { fetchJson } from './api'
import type { ApiResponse } from '../types/models'
import { unwrapApiData } from '../utils/apiResponse'

export type EmrFormTemplate = {
  id: number
  code: string
  name: string
  description?: string | null
  templateGroup: string
  printTemplateCode?: string | null
  version: number
  layoutJson: string
  defaultDataJson?: string | null
  isActive: boolean
  isDefault: boolean
  createdAt?: string
  updatedAt?: string
}

export type EmrFormTemplatePayload = Omit<EmrFormTemplate, 'id' | 'createdAt' | 'updatedAt'>

function normalizeTemplate(raw: any): EmrFormTemplate {
  return {
    id: Number(raw?.id ?? raw?.Id ?? 0),
    code: String(raw?.code ?? raw?.Code ?? ''),
    name: String(raw?.name ?? raw?.Name ?? ''),
    description: raw?.description ?? raw?.Description ?? null,
    templateGroup: String(raw?.templateGroup ?? raw?.TemplateGroup ?? 'EMR'),
    printTemplateCode: raw?.printTemplateCode ?? raw?.PrintTemplateCode ?? null,
    version: Number(raw?.version ?? raw?.Version ?? 1),
    layoutJson: String(raw?.layoutJson ?? raw?.LayoutJson ?? '{}'),
    defaultDataJson: raw?.defaultDataJson ?? raw?.DefaultDataJson ?? null,
    isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? true),
    isDefault: Boolean(raw?.isDefault ?? raw?.IsDefault ?? false),
    createdAt: raw?.createdAt ?? raw?.CreatedAt,
    updatedAt: raw?.updatedAt ?? raw?.UpdatedAt
  }
}

function unwrapTemplates(response: ApiResponse<unknown>): EmrFormTemplate[] {
  const payload = unwrapApiData<unknown>(response)
  const rows = Array.isArray(payload) ? payload : []
  return rows.map(normalizeTemplate).filter(item => item.id && item.code)
}

function unwrapTemplate(response: ApiResponse<unknown>): EmrFormTemplate | null {
  const payload = unwrapApiData<unknown>(response)
  return payload ? normalizeTemplate(payload) : null
}

export async function listEmrFormTemplates() {
  const response = await fetchJson<unknown>('/api/v1/emr/form-templates')
  return unwrapTemplates(response)
}

export async function getEmrFormTemplate(id: number) {
  const response = await fetchJson<unknown>(`/api/v1/emr/form-templates/${id}`)
  return unwrapTemplate(response)
}

export async function createEmrFormTemplate(payload: EmrFormTemplatePayload) {
  const response = await fetchJson<unknown>('/api/v1/emr/form-templates', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return { ...response, data: response.success ? unwrapTemplate(response) : null } as ApiResponse<EmrFormTemplate>
}

export async function updateEmrFormTemplate(id: number, payload: EmrFormTemplatePayload) {
  const response = await fetchJson<unknown>(`/api/v1/emr/form-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  return { ...response, data: response.success ? unwrapTemplate(response) : null } as ApiResponse<EmrFormTemplate>
}

export async function deleteEmrFormTemplate(id: number) {
  return fetchJson<unknown>(`/api/v1/emr/form-templates/${id}`, { method: 'DELETE' })
}
