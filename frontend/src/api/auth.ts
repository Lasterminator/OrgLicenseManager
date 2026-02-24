import type { LoginRequest, LoginResponse } from '../types/api'
import { apiRequest } from './client'

export async function login(body: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    token: null,
  })
}

export async function getClaims(token: string) {
  return apiRequest<{ userId: string; email: string; role: string }>('/api/auth/claims', {
    method: 'GET',
    token,
  })
}
