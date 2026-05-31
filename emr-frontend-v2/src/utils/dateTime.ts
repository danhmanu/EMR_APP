import dayjs from 'dayjs'

export const API_DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

export function toApiDateTime(value?: dayjs.ConfigType | null): string | undefined {
  if (value == null) return undefined
  const parsed = dayjs(value)
  if (!parsed.isValid()) return undefined
  return parsed.format(API_DATE_TIME_FORMAT)
}
