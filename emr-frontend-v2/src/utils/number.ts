export const MAX_DECIMAL_PLACES = 2

export function roundToMaxDecimals(value: number, decimalPlaces = MAX_DECIMAL_PLACES): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** decimalPlaces
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function parseDecimalInput(value?: string | number | null): number {
  if (typeof value === 'number') return roundToMaxDecimals(value)
  if (typeof value !== 'string') return 0

  const trimmed = value.trim()
  if (!trimmed) return 0

  const sanitized = trimmed.replace(/\s+/g, '').replace(/[^\d,.-]/g, '')
  if (!sanitized || sanitized === '-' || sanitized === '.' || sanitized === ',') return 0

  const isNegative = sanitized.startsWith('-')
  const unsigned = sanitized.replace(/-/g, '')
  const lastDotIndex = unsigned.lastIndexOf('.')
  const lastCommaIndex = unsigned.lastIndexOf(',')
  const decimalSeparatorIndex = Math.max(lastDotIndex, lastCommaIndex)

  let normalized = ''
  if (decimalSeparatorIndex >= 0) {
    const integerPart = unsigned.slice(0, decimalSeparatorIndex).replace(/[.,]/g, '')
    const decimalPart = unsigned.slice(decimalSeparatorIndex + 1).replace(/[.,]/g, '').slice(0, MAX_DECIMAL_PLACES)
    normalized = `${integerPart || '0'}${decimalPart ? `.${decimalPart}` : ''}`
  } else {
    normalized = unsigned.replace(/[.,]/g, '')
  }

  const parsed = Number(`${isNegative ? '-' : ''}${normalized}`)
  return Number.isFinite(parsed) ? roundToMaxDecimals(parsed) : 0
}

export function formatGroupedNumber(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return ''
  const numericValue = parseDecimalInput(value)
  return numericValue.toLocaleString('en-US', {
    maximumFractionDigits: MAX_DECIMAL_PLACES
  })
}