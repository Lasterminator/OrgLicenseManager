import type { License, UserOrganization } from '../../types/api'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import { formatDate, formatDateTime, formatRelativeDays } from '../../lib/formatters'

interface MyAccessCardProps {
  membership: UserOrganization
  assignedLicense?: License | null
}

export default function MyAccessCard({ membership, assignedLicense }: MyAccessCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">
            My access
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {membership.name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">
            Joined {formatDate(membership.joinedAt)} and currently scoped as a {membership.role.toLowerCase()} in this workspace.
          </p>
        </div>
        <StatusBadge tone={membership.role === 'Owner' ? 'warning' : membership.role === 'Admin' ? 'info' : 'neutral'}>
          {membership.role}
        </StatusBadge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Membership" value={membership.role} hint="Your organization-level role." />
        <Metric label="Joined" value={formatDate(membership.joinedAt)} hint={formatRelativeDays(membership.joinedAt)} />
        {assignedLicense ? (
          <Metric
            label="License"
            value={assignedLicense.isActive ? (assignedLicense.isExpired ? 'Expired' : 'Active') : 'Revoked'}
            hint={`Expires ${formatDateTime(assignedLicense.expiresAt)}`}
          />
        ) : (
          <Metric label="License" value="Unassigned" hint="No license is currently assigned to you." />
        )}
      </div>
    </Card>
  )
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-white/55 px-4 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">
        {label}
      </p>
      <p className="mt-3 text-xl font-semibold text-[color:var(--text-strong)]">{value}</p>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">{hint}</p>
    </div>
  )
}
