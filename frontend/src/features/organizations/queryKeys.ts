export const organizationQueryKeys = {
  detail: (orgId: string) => ['organization', orgId] as const,
  membership: (orgId: string) => ['organization-membership', orgId] as const,
  members: (orgId: string, page: number) => ['organization-members', orgId, page] as const,
  invitations: (orgId: string, page: number) => ['organization-invitations', orgId, page] as const,
  licenses: (orgId: string, page: number, search?: string) =>
    ['organization-licenses', orgId, page, search ?? ''] as const,
}
