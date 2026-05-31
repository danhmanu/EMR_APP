import http from './http'

export interface Department {
  id: number
  idDepart?: number | null
  code?: string | null
  name: string
  treatment?: boolean
  active?: number | null
  raw?: unknown
}

export interface Room {
  id: number
  idh?: number | null
  code?: string | null
  name: string
  active?: number | null
  raw?: unknown
}

export async function getDepartments(page = 0, pageSize = 1000): Promise<Department[]> {
  const response = await http.get<Department[]>('/api/v1/emr/departments', {
    params: { page, pageSize }
  })

  return response.data || []
}

export async function getRooms(page = 0, pageSize = 1000): Promise<Room[]> {
  const response = await http.get<Room[]>('/api/v1/emr/rooms', {
    params: { page, pageSize }
  })

  return response.data || []
}
