import type { ApiError } from '../types/api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5228'

function getToken(): string | null {
  return localStorage.getItem('token')
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token = getToken(), ...fetchOptions } = options
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    let detail: string
    try {
      const body = await res.json() as ApiError
      detail = body.detail ?? body.title ?? res.statusText
    } catch {
      detail = res.statusText
    }
    const err = new Error(detail) as Error & { status?: number }
    err.status = res.status
    throw err
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function getApiBase(): string {
  return API_BASE
}
