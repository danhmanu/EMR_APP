import { fetchJson } from './api';
import { ApiResponse } from '../types/models';
import { User } from '../models/api';

export const searchUsers = (q: string) => fetchJson<User[]>(`/api/v1/users?q=${encodeURIComponent(q)}&page=1&pageSize=50`);
export const getUser = (id: number) => fetchJson<User>(`/api/v1/users/${id}`);

// compatibility wrappers
export const listUsers = (params:any) => {
  const p = params && typeof params === 'object' ? params : { page: params || 1 };
  const qs = `?page=${p.page||1}&pageSize=${p.pageSize||50}${p.q?`&q=${encodeURIComponent(p.q)}`:''}`;
  return fetchJson<User[]>(`/api/v1/users${qs}`);
}
export const createUser = (payload:any) => fetchJson<User>('/api/v1/users', { method: 'POST', body: JSON.stringify(payload) });
export const updateUser = (id:number, payload:any) => fetchJson<User>(`/api/v1/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const toggleUser = (id:number) => fetchJson<User>(`/api/v1/users/${id}/toggle`, { method: 'PATCH' });

export type MyProfilePayload = {
  displayName: string
  email?: string | null
  position?: string | null
  employeeCode?: string | null
}

export type ChangeMyPasswordPayload = {
  currentPassword: string
  newPassword: string
}

export const getMyProfile = () => fetchJson<User>('/api/v1/auth/me')
export const updateMyProfile = (payload: MyProfilePayload) =>
  fetchJson<User>('/api/v1/auth/me', { method: 'PUT', body: JSON.stringify(payload) })
export const changeMyPassword = (payload: ChangeMyPasswordPayload) =>
  fetchJson<null>('/api/v1/auth/me/change-password', { method: 'POST', body: JSON.stringify(payload) })
