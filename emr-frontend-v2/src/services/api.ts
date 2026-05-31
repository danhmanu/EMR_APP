import { ApiResponse } from "../types/models";
import http, { get as httpGet, post as httpPost, put as httpPut, del as httpDel } from './http';
import { normalizeApiErrorResponse, normalizeApiResponse } from '../utils/apiResponse';

// Compatibility wrapper that re-uses the http client in src/services/http.ts
export async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const method = (options.method || 'GET').toUpperCase();
  try {
    if (method === 'GET') {
      const res = await httpGet<T>(url);
      return normalizeApiResponse<T>(res);
    }
    if (method === 'POST') {
      // if body is provided as a string (JSON), parse it back to object for http.post
      let body: any = undefined;
      try { body = (options as any).body ? JSON.parse((options as any).body as string) : undefined } catch(e) { body = (options as any).body }
      const res = await httpPost<T>(url, body);
      return normalizeApiResponse<T>(res);
    }
    if (method === 'PUT') {
      let body: any = undefined;
      try { body = (options as any).body ? JSON.parse((options as any).body as string) : undefined } catch(e) { body = (options as any).body }
      const res = await httpPut<T>(url, body);
      return normalizeApiResponse<T>(res);
    }
    if (method === 'PATCH') {
      let body: any = undefined;
      try { body = (options as any).body ? JSON.parse((options as any).body as string) : undefined } catch(e) { body = (options as any).body }
      const res = await (http as any).patch(url, body);
      return normalizeApiResponse<T>(res);
    }
    if (method === 'DELETE') {
      const res = await httpDel<T>(url);
      return normalizeApiResponse<T>(res);
    }
    // fallback: use GET
    const res = await httpGet<T>(url);
    return normalizeApiResponse<T>(res);
  } catch (err: any) {
    return normalizeApiErrorResponse<T>(err)
  }
}

// Lightweight compatibility shim used by some pages (Dashboard)
export const DevicesApi = {
  list: (opts: { page?: number; pageSize?: number; q?: string } = {}) => {
    const p = opts.page || 1
    const ps = opts.pageSize || 10
    const q = opts.q || ''
    return fetchJson<any>(`/api/v1/devices?page=${p}&pageSize=${ps}&q=${encodeURIComponent(q)}`)
  },
  get: (id:number) => fetchJson<any>(`/api/v1/devices/${id}`)
}
