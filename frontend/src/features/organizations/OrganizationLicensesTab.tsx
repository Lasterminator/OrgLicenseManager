import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOrgLicenses } from '../../api/organizations'
import Button from '../../components/Button'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { formatDateTime, formatRelativeDays } from '../../lib/formatters'
import { organizationQueryKeys } from './queryKeys'

interface OrganizationLicensesTabProps {
  orgId: string
}

export default function OrganizationLicensesTab({ orgId }: OrganizationLicensesTabProps) {
  const [page, setPage] = useState(1)

  const licensesQuery = useQuery({
    queryKey: organizationQueryKeys.licenses(orgId, page),
    queryFn: () => getOrgLicenses(orgId, { page, pageSize: 10, sortBy: 'expiresAt' }),
  })

  const licenses = licensesQuery.data?.items ?? []

  return (
    <Card padding="none">
      {licensesQuery.isLoading ? (
        <div className="px-5 py-6 text-sm text-[color:var(--text-muted)]">Loading licenses…</div>
      ) : licenses.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No licenses for this organization"
            description="System admins can create new licenses from the global admin workspace."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[color:var(--border)]">
            <thead className="bg-[rgba(255,255,255,0.45)]">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Assigned to</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Expires</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {licenses.map((license) => (
                <tr key={license.id}>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={license.isActive ? 'success' : 'neutral'}>
                        {license.isActive ? 'Active' : 'Revoked'}
                      </StatusBadge>
                      {license.isExpired && license.isActive && (
                        <StatusBadge tone="warning">Expired</StatusBadge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-[color:var(--text-muted)]">
                    {license.assignedToEmail ?? 'Unassigned'}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <p className="text-sm font-medium text-[color:var(--text-strong)]">
                      {formatDateTime(license.expiresAt)}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                      {formatRelativeDays(license.expiresAt)}
                    </p>
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-[color:var(--text-muted)]">
                    {license.autoRenewal ? 'Auto-renew enabled' : 'Manual renewal'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {licensesQuery.data && licensesQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[color:var(--border)] px-5 py-4 text-sm text-[color:var(--text-muted)]">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {licensesQuery.data.totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={page >= licensesQuery.data.totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  )
}
