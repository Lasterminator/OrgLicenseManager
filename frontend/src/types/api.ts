// Auth
export interface LoginRequest {
  userId: string
  email: string
  role: string
}

export interface LoginResponse {
  token: string
  expiresAt: string
  userId: string
  email: string
  role: string
}

// Organization
export interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  memberCount: number
}

export interface CreateOrganizationRequest {
  name: string
  description?: string
}

export interface UpdateOrganizationRequest {
  name?: string
  description?: string
}

// Member
export interface LicenseInfo {
  id: string
  expiresAt: string
  isExpired: boolean
  autoRenewal: boolean
}

export interface Member {
  userId: string
  email: string
  role: string
  joinedAt: string
  license: LicenseInfo | null
}

export interface UpdateMemberRoleRequest {
  role: string
}

// License
export interface License {
  id: string
  organizationId: string
  assignedToUserId: string | null
  assignedToEmail: string | null
  expiresAt: string
  autoRenewal: boolean
  isActive: boolean
  isExpired: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateLicenseRequest {
  autoRenewal?: boolean
}

export interface UpdateLicenseRequest {
  expiresAt?: string
  autoRenewal?: boolean
}

export interface AssignLicenseRequest {
  licenseId: string
}

// Invitation
export interface Invitation {
  id: string
  organizationId: string
  organizationName: string
  email: string
  token: string
  role: string
  expiresAt: string
  invitedByUserId: string | null
  createdAt: string
}

export interface CreateInvitationRequest {
  email: string
  role: string
}

// Membership (user's view)
export interface UserOrganization {
  id: string
  name: string
  description: string | null
  role: string
  joinedAt: string
}

export interface AcceptInvitationRequest {
  token: string
}

// Pagination
export interface PaginationRequest {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDescending?: boolean
  search?: string
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// API error (ProblemDetails)
export interface ApiError {
  type?: string
  title?: string
  status?: number
  detail?: string
}
