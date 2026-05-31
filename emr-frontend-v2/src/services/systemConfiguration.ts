import { fetchJson } from './api'
import type { ApiResponse } from '../types/models'
import { unwrapApiData } from '../utils/apiResponse'

export type SystemConfiguration = {
  id: number
  code: string
  value?: string | null
  description?: string | null
}

export type SystemConfigurationItemPayload = {
  code: string
  value?: string | null
  description?: string | null
}

export type SystemConfigurationPayload = {
  items: SystemConfigurationItemPayload[]
}

function normalizeSystemConfiguration(raw: any): SystemConfiguration {
  return {
    id: Number(raw?.id ?? raw?.Id ?? 0),
    code: String(raw?.code ?? raw?.Code ?? ''),
    value: raw?.value ?? raw?.Value ?? null,
    description: raw?.description ?? raw?.Description ?? null
  }
}

function unwrapSystemConfigurations(response: ApiResponse<unknown>): SystemConfiguration[] {
  const payload = unwrapApiData<unknown>(response)
  const rows = Array.isArray(payload) ? payload : []
  return rows.map(normalizeSystemConfiguration).filter((item) => item.code)
}

export async function getSystemConfiguration() {
  const response = await fetchJson<unknown>('/api/v1/system-configuration')
  return unwrapSystemConfigurations(response)
}

export async function getSystemConfigurationByCode(code: string) {
  const response = await fetchJson<unknown>(`/api/v1/system-configuration/${encodeURIComponent(code)}`)
  const payload = unwrapApiData<unknown>(response)
  return payload ? normalizeSystemConfiguration(payload) : null
}

export async function updateSystemConfiguration(payload: SystemConfigurationPayload) {
  const response = await fetchJson<unknown>('/api/v1/system-configuration', {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

  return {
    ...response,
    data: response.success ? unwrapSystemConfigurations(response) : []
  } as ApiResponse<SystemConfiguration[]>
}
