import http from './http'

export interface PermissionData {
  userId: number
  username: string
  displayName?: string
  departmentId?: number | null
  role: string
  mode: 'permission' | 'role'
  permissions: string[]
}

export interface RolePermissions {
  id: number
  name: string
  permissions: string[]
}

export interface PermissionItem {
  id: number
  code: string
  description?: string
}

// Get current user's permissions
export async function getCurrentUserPermissions(): Promise<PermissionData | null> {
  try {
    const res = await http.get<PermissionData>('/api/v1/auth/me/permissions')
    return res.success ? res.data : null
  } catch (error) {
    console.error('Failed to fetch current user permissions:', error)
    return null
  }
}

export async function getPermissionItems(): Promise<PermissionItem[]> {
  try {
    const res = await http.get<PermissionItem[]>('/api/v1/admin/permission-items')
    return res.success ? (res.data || []) : []
  } catch (error) {
    console.error('Failed to fetch permission items:', error)
    return []
  }
}

export async function getRolePermissionIds(roleId: number): Promise<number[]> {
  try {
    const res = await http.get<number[]>(`/api/v1/admin/roles/${roleId}/permissions`)
    return res.success ? (res.data || []) : []
  } catch (error) {
    console.error('Failed to fetch role permissions:', error)
    return []
  }
}

// Get all roles with permissions
export async function getAllRoles(): Promise<any[]> {
  try {
    const res = await http.get('/api/v1/admin/roles')
    return res.success ? res.data : []
  } catch (error) {
    console.error('Failed to fetch all roles:', error)
    return []
  }
}

export async function assignRolePermissionIds(
  roleId: number,
  permissionItemIds: number[]
): Promise<boolean> {
  try {
    const res = await http.post(`/api/v1/admin/roles/${roleId}/permissions`, {
      permissionItemIds
    })
    return res.success
  } catch (error) {
    console.error('Failed to assign role permissions:', error)
    return false
  }
}

// Compatibility helper for older screens: accepts permission codes but persists PermissionItem ids.
export async function updateRolePermissions(
  roleId: number,
  permissions: string[]
): Promise<boolean> {
  try {
    const permissionItems = await getPermissionItems()
    const permissionIds = permissions
      .map(code => permissionItems.find(item => item.code === code)?.id)
      .filter((id): id is number => typeof id === 'number')

    return assignRolePermissionIds(roleId, permissionIds)
  } catch (error) {
    console.error('Failed to update role permissions:', error)
    return false
  }
}
