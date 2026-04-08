import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  assignLicense,
  getMembers,
  getOrgLicenses,
  removeMember,
  unassignLicense,
  updateMemberRole,
} from '../../api/organizations'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import Toast from '../../components/Toast'
import type { License, Member } from '../../types/api'
import { formatDateTime } from '../../lib/formatters'
import { organizationQueryKeys } from './queryKeys'

interface OrganizationMembersTabProps {
  orgId: string
  viewerRole: 'Owner' | 'Admin'
  currentUserEmail?: string
}

export default function OrganizationMembersTab({
  orgId,
  viewerRole,
  currentUserEmail,
}: OrganizationMembersTabProps) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [roleTarget, setRoleTarget] = useState<Member | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
  const [assignTarget, setAssignTarget] = useState<Member | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const membersQuery = useQuery({
    queryKey: organizationQueryKeys.members(orgId, page),
    queryFn: () => getMembers(orgId, { page, pageSize: 10 }),
  })

  const invalidateMemberData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.members(orgId, page) }),
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.detail(orgId) }),
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.licenses(orgId, 1) }),
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.licenses(orgId, 1, currentUserEmail) }),
    ])
  }

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(orgId, userId),
    onSuccess: async () => {
      setRemoveTarget(null)
      setToast({ message: 'Member removed.', type: 'success' })
      await invalidateMemberData()
    },
    onError: (error) => {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to remove member',
        type: 'error',
      })
    },
  })

  const members = membersQuery.data?.items ?? []

  if (membersQuery.isLoading) {
    return <Card><p className="text-sm text-[color:var(--text-muted)]">Loading members…</p></Card>
  }

  if (membersQuery.isError) {
    return (
      <EmptyState
        title="Couldn’t load members"
        description={
          membersQuery.error instanceof Error
            ? membersQuery.error.message
            : 'Please refresh and try again.'
        }
        action={<Button onClick={() => membersQuery.refetch()}>Retry</Button>}
      />
    )
  }

  return (
    <>
      <Card padding="none">
        {members.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No members yet"
              description="Invite teammates to start collaborating in this organization."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[color:var(--border)]">
              <thead className="bg-[rgba(255,255,255,0.45)]">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Member</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Role</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">License</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {members.map((member) => {
                  const isSelf = member.email === currentUserEmail
                  const ownerRoleLocked = viewerRole !== 'Owner' && member.role === 'Owner'

                  return (
                    <tr key={member.userId}>
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-[color:var(--text-strong)]">{member.email}</p>
                        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <StatusBadge tone={member.role === 'Owner' ? 'warning' : member.role === 'Admin' ? 'info' : 'neutral'}>
                          {member.role}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-[color:var(--text-muted)]">
                        {member.license ? (
                          <>
                            <p className="font-medium text-[color:var(--text-strong)]">
                              {member.license.isExpired ? 'Expired' : 'Active'}
                            </p>
                            <p className="mt-1 text-xs">
                              Expires {formatDateTime(member.license.expiresAt)}
                            </p>
                          </>
                        ) : (
                          'No license'
                        )}
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex justify-end gap-2">
                          {!ownerRoleLocked && (
                            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => setRoleTarget(member)}>
                              Change role
                            </Button>
                          )}
                          {member.license ? (
                            <Button
                              variant="ghost"
                              className="px-3 py-2 text-xs"
                              onClick={() => {
                                unassignLicense(orgId, member.userId)
                                  .then(async () => {
                                    setToast({ message: 'License unassigned.', type: 'success' })
                                    await invalidateMemberData()
                                  })
                                  .catch((error) => {
                                    setToast({
                                      message: error instanceof Error ? error.message : 'Failed to unassign license',
                                      type: 'error',
                                    })
                                  })
                              }}
                            >
                              Unassign license
                            </Button>
                          ) : (
                            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => setAssignTarget(member)}>
                              Assign license
                            </Button>
                          )}
                          {!isSelf && member.role !== 'Owner' && (
                            <Button
                              variant="ghost"
                              className="px-3 py-2 text-xs text-[color:var(--danger)]"
                              onClick={() => setRemoveTarget(member)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {membersQuery.data && membersQuery.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[color:var(--border)] px-5 py-4 text-sm text-[color:var(--text-muted)]">
            <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <span>
              Page {page} of {membersQuery.data.totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={page >= membersQuery.data.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {roleTarget && (
        <ChangeRoleModal
          orgId={orgId}
          member={roleTarget}
          viewerRole={viewerRole}
          onClose={() => setRoleTarget(null)}
          onSaved={async (message) => {
            setRoleTarget(null)
            setToast({ message, type: 'success' })
            await invalidateMemberData()
          }}
          onError={(message) => setToast({ message, type: 'error' })}
        />
      )}

      {assignTarget && (
        <AssignLicenseModal
          orgId={orgId}
          member={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSaved={async (message) => {
            setAssignTarget(null)
            setToast({ message, type: 'success' })
            await invalidateMemberData()
          }}
          onError={(message) => setToast({ message, type: 'error' })}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove member"
          description={`Remove ${removeTarget.email} from this organization? Their assigned license will be cleared first.`}
          confirmLabel="Remove member"
          tone="danger"
          loading={removeMemberMutation.isPending}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => removeMemberMutation.mutate(removeTarget.userId)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

function ChangeRoleModal({
  orgId,
  member,
  viewerRole,
  onClose,
  onSaved,
  onError,
}: {
  orgId: string
  member: Member
  viewerRole: 'Owner' | 'Admin'
  onClose: () => void
  onSaved: (message: string) => Promise<void> | void
  onError: (message: string) => void
}) {
  const [role, setRole] = useState(member.role)

  const updateRoleMutation = useMutation({
    mutationFn: () => updateMemberRole(orgId, member.userId, { role }),
    onSuccess: () => onSaved('Role updated.'),
    onError: (error) => {
      onError(error instanceof Error ? error.message : 'Failed to update role')
    },
  })

  const options = viewerRole === 'Owner' ? ['Member', 'Admin', 'Owner'] : ['Member', 'Admin']

  return (
    <Modal
      title={`Change role for ${member.email}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={updateRoleMutation.isPending} onClick={() => updateRoleMutation.mutate()}>
            Save role
          </Button>
        </>
      }
    >
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Modal>
  )
}

function AssignLicenseModal({
  orgId,
  member,
  onClose,
  onSaved,
  onError,
}: {
  orgId: string
  member: Member
  onClose: () => void
  onSaved: (message: string) => Promise<void> | void
  onError: (message: string) => void
}) {
  const licensesQuery = useQuery({
    queryKey: organizationQueryKeys.licenses(orgId, 1),
    queryFn: () => getOrgLicenses(orgId, { pageSize: 100 }),
  })

  const assignLicenseMutation = useMutation({
    mutationFn: (licenseId: string) => assignLicense(orgId, member.userId, licenseId),
    onSuccess: () => onSaved('License assigned.'),
    onError: (error) => {
      onError(error instanceof Error ? error.message : 'Failed to assign license')
    },
  })

  const availableLicenses = (licensesQuery.data?.items ?? []).filter(
    (license) => !license.assignedToUserId || license.assignedToEmail === member.email
  )

  return (
    <Modal title={`Assign license to ${member.email}`} onClose={onClose}>
      {licensesQuery.isLoading ? (
        <p className="text-sm text-[color:var(--text-muted)]">Loading available licenses…</p>
      ) : availableLicenses.length === 0 ? (
        <p className="text-sm leading-6 text-[color:var(--text-muted)]">
          No unassigned licenses are available yet. Create one from the admin license panel first.
        </p>
      ) : (
        <ul className="space-y-3">
          {availableLicenses.map((license: License) => (
            <li
              key={license.id}
              className="flex flex-col gap-3 rounded-3xl border border-[color:var(--border)] bg-white/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-[color:var(--text-strong)]">
                  Expires {formatDateTime(license.expiresAt)}
                </p>
                <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                  {license.autoRenewal ? 'Auto-renew enabled' : 'Manual renewal'}
                </p>
              </div>
              <Button
                variant="secondary"
                loading={assignLicenseMutation.isPending}
                onClick={() => assignLicenseMutation.mutate(license.id)}
              >
                Assign
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
