import type { ApiResponse } from '../types/models'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function normalizeApiResponse<T>(payload: unknown): ApiResponse<T> {
  if (isObject(payload) && 'success' in payload && 'data' in payload) {
    return payload as ApiResponse<T>
  }

  if (isObject(payload) && 'code' in payload && 'data' in payload) {
    const rawCode = payload.code
    const numericCode = typeof rawCode === 'number' ? rawCode : Number(rawCode)
    const success = Number.isFinite(numericCode)
      ? numericCode === 0 || (numericCode >= 200 && numericCode < 300)
      : false

    return {
      success,
      data: (payload.data ?? null) as T | null,
      message: typeof payload.message === 'string' ? payload.message : undefined,
      code: rawCode as number | string | undefined
    }
  }

  return {
    success: true,
    data: payload === undefined || payload === '' ? null : payload as T
  }
}

export function unwrapApiData<T>(response: unknown): T | null {
  if (!response) return null

  if (isObject(response) && 'data' in response) {
    const firstLayer = response.data
    if (isObject(firstLayer) && 'success' in firstLayer && 'data' in firstLayer) {
      return (firstLayer.data ?? null) as T | null
    }
    return (firstLayer ?? null) as T | null
  }

  return response as T
}

export function getApiErrorMessage(error: unknown, fallback = 'Yêu cầu thất bại'): string {
  const err = error as { response?: { data?: unknown }; message?: string }
  const responseData = err?.response?.data

  if (isObject(responseData)) {
    if (typeof responseData.message === 'string' && responseData.message) return responseData.message
    if (typeof responseData.title === 'string' && responseData.title) return responseData.title

    if (Array.isArray(responseData.errors)) {
      const firstError = responseData.errors[0]
      if (typeof firstError === 'string') return firstError
      if (isObject(firstError) && typeof firstError.message === 'string') return firstError.message
    }

    if (isObject(responseData.errors)) {
      const firstError = Object.values(responseData.errors).flat().find(Boolean)
      if (firstError) return String(firstError)
    }
  }

  return err?.message || fallback
}

export function normalizeApiErrorResponse<T>(error: unknown, fallback = 'Network error'): ApiResponse<T> {
  const err = error as { response?: { data?: unknown }; message?: string }
  const responseData = err?.response?.data
  const message = getApiErrorMessage(error, fallback)

  let errors: string[] = [message]
  let code: number | string | undefined

  if (isObject(responseData)) {
    code = responseData.code as number | string | undefined

    if (Array.isArray(responseData.errors)) {
      errors = responseData.errors.map((item) => {
        if (typeof item === 'string') return item
        if (isObject(item) && typeof item.message === 'string') return item.message
        return String(item)
      })
    } else if (isObject(responseData.errors)) {
      errors = Object.values(responseData.errors).flat().map((item) => String(item))
    }
  }

  return {
    success: false,
    data: null,
    message,
    errors,
    code
  }
}
