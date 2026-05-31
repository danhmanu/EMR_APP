import axios from 'axios';
import type { ApiResponse } from '../types/models';
import { normalizeApiResponse } from '../utils/apiResponse';

const BASE = (import.meta as any).env?.VITE_API_BASE || '';

function getAuthHeader(){
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

const client = axios.create({ baseURL: BASE, withCredentials: true });

client.interceptors.request.use(cfg => {
  // Don't add auth headers to login endpoint
  if (!cfg.url?.includes('/auth/login') && !cfg.url?.includes('/auth/logout')) {
    cfg.headers = { ...(cfg.headers || {}), ...getAuthHeader() } as any;
  }
  return cfg;
});

client.interceptors.response.use(
  r => r,
  err => {
    const url = String(err?.config?.url || '')
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/logout')
    if (err?.response?.status === 401 && !isAuthEndpoint) {
      try { localStorage.removeItem('auth_token') } catch(e){}
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const get = async <T = any>(url: string, config = {}): Promise<ApiResponse<T>> => {
  const r = await client.get(url, config as any);
  return normalizeApiResponse<T>(r.data);
}
export const post = async <T = any>(url: string, data?: any, config = {}): Promise<ApiResponse<T>> => {
  const r = await client.post(url, data, config as any);
  return normalizeApiResponse<T>(r.data);
}
export const put = async <T = any>(url: string, data?: any, config = {}): Promise<ApiResponse<T>> => {
  const r = await client.put(url, data, config as any);
  return normalizeApiResponse<T>(r.data);
}
export const patch = async <T = any>(url: string, data?: any, config = {}): Promise<ApiResponse<T>> => {
  const r = await client.patch(url, data, config as any);
  return normalizeApiResponse<T>(r.data);
}
export const del = async <T = any>(url: string, config = {}): Promise<ApiResponse<T>> => {
  const r = await client.delete(url, config as any);
  return normalizeApiResponse<T>(r.data);
}

export default { get, post, put, patch, delete: del };
