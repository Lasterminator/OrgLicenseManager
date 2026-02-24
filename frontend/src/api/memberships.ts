import type { UserOrganization, AcceptInvitationRequest } from '../types/api'
import { apiRequest } from './client'

export async function getMyOrganizations(): Promise<UserOrganization[]> {
  return apiRequest<UserOrganization[]>('/api/memberships')
}

export async function getMyOrganization(orgId: string): Promise<UserOrganization> {
  return apiRequest<UserOrganization>(`/api/memberships/${orgId}`)
}

export async function leaveOrganization(orgId: string): Promise<void> {
  return apiRequest<void>(`/api/memberships/${orgId}`, { method: 'DELETE' })
}

export async function acceptInvitation(body: AcceptInvitationRequest): Promise<UserOrganization> {
  return apiRequest<UserOrganization>('/api/memberships/invitations/accept', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
