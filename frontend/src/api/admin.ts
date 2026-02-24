import type {
  License,
  CreateLicenseRequest,
  UpdateLicenseRequest,
  PagedResult,
  PaginationRequest,
} from '../types/api'
import { apiRequest } from './client'

export async function getAllLicenses(params?: PaginationRequest): Promise<PagedResult<License>> {
  const search = new URLSearchParams()
  if (params?.page) search.set('page', String(params.page))
  if (params?.pageSize) search.set('pageSize', String(params.pageSize))
  if (params?.sortBy) search.set('sortBy', params.sortBy)
  if (params?.sortDescending != null) search.set('sortDescending', String(params.sortDescending))
  if (params?.search) search.set('search', params.search)
  const q = search.toString()
  return apiRequest<PagedResult<License>>(`/api/admin/licenses${q ? `?${q}` : ''}`)
}

export async function createLicense(organizationId: string, body?: CreateLicenseRequest): Promise<License> {
  return apiRequest<License>(`/api/admin/licenses/organizations/${organizationId}`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })
}

export async function updateLicense(licenseId: string, body: UpdateLicenseRequest): Promise<License> {
  return apiRequest<License>(`/api/admin/licenses/${licenseId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function cancelLicense(licenseId: string): Promise<void> {
  return apiRequest<void>(`/api/admin/licenses/${licenseId}`, { method: 'DELETE' })
}

export interface LicenseSettings {
  expirationMinutes: number
}

export async function getLicenseSettings(): Promise<LicenseSettings> {
  return apiRequest<LicenseSettings>('/api/admin/licenses/settings')
}

export async function updateLicenseSettings(expirationMinutes: number): Promise<LicenseSettings> {
  return apiRequest<LicenseSettings>('/api/admin/licenses/settings', {
    method: 'PUT',
    body: JSON.stringify({ expirationMinutes }),
  })
}
