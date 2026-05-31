import { fetchJson } from './api'
import { normalizeRole } from 'constants/systemRoles'

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USERNAME_KEY = 'auth_username'
const AUTH_ROLE_KEY = 'auth_role'
const AUTH_DEPARTMENT_KEY = 'auth_department_id'

export type AuthSession = {
  token?: string | null
  username?: string | null
  role?: string | null
  departmentId?: number | null
}

function readJwtPayload(token?: string | null) {
  if (!token) return null

  try {
    const encodedPayload = token.split('.')[1]
    if (!encodedPayload || typeof window === 'undefined') return null
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const json = window.atob(base64)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function login(payload: { username: string, password: string }){
  return fetchJson('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export function persistAuthSession(session: AuthSession){
  if (session.token) localStorage.setItem(AUTH_TOKEN_KEY, session.token)
  if (session.username) localStorage.setItem(AUTH_USERNAME_KEY, session.username)
  if (session.role) localStorage.setItem(AUTH_ROLE_KEY, session.role)
  if (session.departmentId != null) localStorage.setItem(AUTH_DEPARTMENT_KEY, String(session.departmentId))
}

export function clearAuthSession(){
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USERNAME_KEY)
  localStorage.removeItem(AUTH_ROLE_KEY)
  localStorage.removeItem(AUTH_DEPARTMENT_KEY)
}

export function getStoredRole(){
  if (typeof window === 'undefined') return null
  const storedRole = localStorage.getItem(AUTH_ROLE_KEY)
  if (storedRole) return normalizeRole(storedRole)
  const payload = readJwtPayload(localStorage.getItem(AUTH_TOKEN_KEY))
  return normalizeRole((payload?.role as string) || (payload?.roles as string) || null)
}

export function getStoredUsername(){
  if (typeof window === 'undefined') return null
  const storedUsername = localStorage.getItem(AUTH_USERNAME_KEY)
  if (storedUsername) return storedUsername
  const payload = readJwtPayload(localStorage.getItem(AUTH_TOKEN_KEY))
  return (payload?.username as string) || (payload?.unique_name as string) || null
}

export function getStoredDepartmentId(){
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(AUTH_DEPARTMENT_KEY)
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : null
}

export function hasAnyRole(roles: string[]){
  const currentRole = normalizeRole(getStoredRole())
  if (!roles.length) return true
  if (!currentRole) return false
  return roles.some((role) => normalizeRole(role)?.toLowerCase() === currentRole.toLowerCase())
}

export async function logout(){
  try{ await fetchJson('/api/v1/auth/logout', { method: 'POST' }) }catch(e){ /* ignore */ }
  clearAuthSession()
  return true
}

export function isAuthenticated(){ return !!localStorage.getItem(AUTH_TOKEN_KEY) }
