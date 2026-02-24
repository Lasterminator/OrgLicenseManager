import type {
  Organization,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  Member,
  UpdateMemberRoleRequest,
  License,
  Invitation,
  CreateInvitationRequest,
  PagedResult,
  PaginationRequest,
} from '../types/api'
import { apiRequest } from './client'

export async function getOrganizations(): Promise<Organization[]> {
  return apiRequest<Organization[]>('/api/organizations')
}

export async function getOrganization(id: string): Promise<Organization> {
  return apiRequest<Organization>(`/api/organizations/${id}`)
}

export async function createOrganization(body: CreateOrganizationRequest): Promise<Organization> {
  return apiRequest<Organization>('/api/organizations', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateOrganization(
  id: string,
  body: UpdateOrganizationRequest
): Promise<Organization> {
  return apiRequest<Organization>(`/api/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteOrganization(id: string): Promise<void> {
  return apiRequest<void>(`/api/organizations/${id}`, { method: 'DELETE' })
}

export async function getMembers(
  orgId: string,
  params?: PaginationRequest
): Promise<PagedResult<Member>> {
  const search = new URLSearchParams()
  if (params?.page) search.set('page', String(params.page))
  if (params?.pageSize) search.set('pageSize', String(params.pageSize))
  if (params?.sortBy) search.set('sortBy', params.sortBy)
  if (params?.sortDescending != null) search.set('sortDescending', String(params.sortDescending))
  if (params?.search) search.set('search', params.search)
  const q = search.toString()
  return apiRequest<PagedResult<Member>>(
    `/api/organizations/${orgId}/users${q ? `?${q}` : ''}`
  )
}

export async function getMember(orgId: string, userId: string): Promise<Member> {
  return apiRequest<Member>(`/api/organizations/${orgId}/users/${userId}`)
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  body: UpdateMemberRoleRequest
): Promise<void> {
  return apiRequest<void>(`/api/organizations/${orgId}/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
  return apiRequest<void>(`/api/organizations/${orgId}/users/${userId}/remove`, {
    method: 'POST',
  })
}

export async function assignLicense(
  orgId: string,
  userId: string,
  licenseId: string
): Promise<void> {
  return apiRequest<void>(`/api/organizations/${orgId}/users/${userId}/license`, {
    method: 'POST',
    body: JSON.stringify({ licenseId }),
  })
}

export async function unassignLicense(orgId: string, userId: string): Promise<void> {
  return apiRequest<void>(`/api/organizations/${orgId}/users/${userId}/license`, {
    method: 'DELETE',
  })
}

export async function getInvitations(
  orgId: string,
  params?: PaginationRequest
): Promise<PagedResult<Invitation>> {
  const search = new URLSearchParams()
  if (params?.page) search.set('page', String(params.page))
  if (params?.pageSize) search.set('pageSize', String(params.pageSize))
  const q = search.toString()
  return apiRequest<PagedResult<Invitation>>(
    `/api/organizations/${orgId}/invitations${q ? `?${q}` : ''}`
  )
}

export async function inviteUser(
  orgId: string,
  body: CreateInvitationRequest
): Promise<Invitation> {
  return apiRequest<Invitation>(`/api/organizations/${orgId}/invite`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function cancelInvitation(orgId: string, invitationId: string): Promise<void> {
  return apiRequest<void>(`/api/organizations/${orgId}/invitations/${invitationId}`, {
    method: 'DELETE',
  })
}

export async function getOrgLicenses(
  orgId: string,
  params?: PaginationRequest
): Promise<PagedResult<License>> {
  const search = new URLSearchParams()
  if (params?.page) search.set('page', String(params.page))
  if (params?.pageSize) search.set('pageSize', String(params.pageSize))
  const q = search.toString()
  return apiRequest<PagedResult<License>>(
    `/api/organizations/${orgId}/licenses${q ? `?${q}` : ''}`
  )
}
