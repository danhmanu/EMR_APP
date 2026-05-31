export const SYSTEM_ROLES = {
  admin: 'ADMIN',
  engineer: 'ENGINEER',
  technician: 'TECHNICIAN',
  departmentUser: 'DEPARTMENT_USER',
  accountant: 'ACCOUNTANT',
  procurement: 'PROCUREMENT'
} as const

export const DEVICE_ROLES = [
  SYSTEM_ROLES.admin,
  SYSTEM_ROLES.engineer,
  SYSTEM_ROLES.technician,
  SYSTEM_ROLES.departmentUser,
  SYSTEM_ROLES.accountant,
  SYSTEM_ROLES.procurement
]

export const REPAIR_LIST_ROLES = DEVICE_ROLES

export const REPAIR_CREATE_ROLES = DEVICE_ROLES

export const REPAIR_EXECUTE_ROLES = [
  SYSTEM_ROLES.admin,
  SYSTEM_ROLES.engineer,
  SYSTEM_ROLES.technician
]

export const MAINTENANCE_ROLES = [
  SYSTEM_ROLES.admin,
  SYSTEM_ROLES.engineer,
  SYSTEM_ROLES.technician,
  SYSTEM_ROLES.procurement
]

export const MAINTENANCE_EXECUTE_ROLES = [
  SYSTEM_ROLES.admin,
  SYSTEM_ROLES.technician
]

export const USER_MANAGEMENT_ROLES = [SYSTEM_ROLES.admin]

export const TRANSFER_ROLES = DEVICE_ROLES

export const ASSET_OUTPUT_ROLES = DEVICE_ROLES

export const PROCUREMENT_ROLES = [
  SYSTEM_ROLES.admin,
  SYSTEM_ROLES.engineer,
  SYSTEM_ROLES.technician,
  SYSTEM_ROLES.departmentUser,
  SYSTEM_ROLES.accountant,
  SYSTEM_ROLES.procurement
]

export function normalizeRole(role?: string | null): string | null {
  if (!role) return null

  const value = role.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (value === 'admin') return SYSTEM_ROLES.admin
  if (value === 'engineer' || value === 'ky_thuat') return SYSTEM_ROLES.engineer
  if (value === 'technician' || value === 'vat_tu_thiet_bi') return SYSTEM_ROLES.technician
  if (value === 'department_user' || value === 'deptuser' || value === 'departmentuser' || value === 'khoa_phong') return SYSTEM_ROLES.departmentUser
  if (value === 'accountant' || value === 'ke_toan' || value === 'ketoan') return SYSTEM_ROLES.accountant
  if (value === 'procurement' || value === 'mua_hang' || value === 'muahang') return SYSTEM_ROLES.procurement
  return role.trim().toUpperCase()
}
