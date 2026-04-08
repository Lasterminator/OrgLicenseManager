import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelInvitation, getInvitations, inviteUser } from '../../api/organizations'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import Toast from '../../components/Toast'
import { formatDateTime } from '../../lib/formatters'
import type { Invitation } from '../../types/api'
import { organizationQueryKeys } from './queryKeys'

interface OrganizationInvitationsTabProps {
  orgId: string
  viewerRole: 'Owner' | 'Admin'
}

export default function OrganizationInvitationsTab({
  orgId,
  viewerRole,
}: OrganizationInvitationsTabProps) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Invitation | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const invitationsQuery = useQuery({
    queryKey: organizationQueryKeys.invitations(orgId, page),
    queryFn: () => getInvitations(orgId, { page, pageSize: 10 }),
  })

  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => cancelInvitation(orgId, invitationId),
    onSuccess: async () => {
      setCancelTarget(null)
      setToast({ message: 'Invitation canceled.', type: 'success' })
      await queryClient.invalidateQueries({ queryKey: organizationQueryKeys.invitations(orgId, page) })
    },
    onError: (error) => {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to cancel invitation',
        type: 'error',
      })
    },
  })

  const invitations = invitationsQuery.data?.items ?? []

  return (
    <>
      <Card padding="none">
        <div className="border-b border-[color:var(--border)] px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">Pending invitations</h3>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                Invite teammates by email and control role assignment before they join.
              </p>
            </div>
            <Button onClick={() => setInviteOpen(true)}>Invite user</Button>
          </div>
        </div>
        {invitationsQuery.isLoading ? (
          <div className="px-5 py-6 text-sm text-[color:var(--text-muted)]">Loading invitations…</div>
        ) : invitations.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No pending invitations"
              description="Invite a teammate to start collaborating in this workspace."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[color:var(--border)]">
              <thead className="bg-[rgba(255,255,255,0.45)]">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Invitee</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Role</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Expires</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-5 py-4 text-sm font-medium text-[color:var(--text-strong)]">
                      {invitation.email}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={invitation.role === 'Owner' ? 'warning' : invitation.role === 'Admin' ? 'info' : 'neutral'}>
                        {invitation.role}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-sm text-[color:var(--text-muted)]">
                      {formatDateTime(invitation.expiresAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        className="px-3 py-2 text-xs text-[color:var(--danger)]"
                        onClick={() => setCancelTarget(invitation)}
                      >
                        Cancel
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {invitationsQuery.data && invitationsQuery.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[color:var(--border)] px-5 py-4 text-sm text-[color:var(--text-muted)]">
            <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <span>
              Page {page} of {invitationsQuery.data.totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={page >= invitationsQuery.data.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {inviteOpen && (
        <InviteUserModal
          orgId={orgId}
          viewerRole={viewerRole}
          onClose={() => setInviteOpen(false)}
          onSaved={async (message) => {
            setInviteOpen(false)
            setToast({ message, type: 'success' })
            await queryClient.invalidateQueries({ queryKey: organizationQueryKeys.invitations(orgId, page) })
          }}
          onError={(message) => setToast({ message, type: 'error' })}
        />
      )}

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel invitation"
          description={`Cancel the invitation sent to ${cancelTarget.email}?`}
          confirmLabel="Cancel invitation"
          tone="danger"
          loading={cancelInvitationMutation.isPending}
          onCancel={() => setCancelTarget(null)}
          onConfirm={() => cancelInvitationMutation.mutate(cancelTarget.id)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

function InviteUserModal({
  orgId,
  viewerRole,
  onClose,
  onSaved,
  onError,
}: {
  orgId: string
  viewerRole: 'Owner' | 'Admin'
  onClose: () => void
  onSaved: (message: string) => Promise<void> | void
  onError: (message: string) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Member')

  const inviteMutation = useMutation({
    mutationFn: () => inviteUser(orgId, { email: email.trim(), role }),
    onSuccess: () => onSaved('Invitation sent. Check the API log or email provider for delivery.'),
    onError: (error) => {
      onError(error instanceof Error ? error.message : 'Failed to send invitation')
    },
  })

  const roleOptions = viewerRole === 'Owner' ? ['Member', 'Admin', 'Owner'] : ['Member', 'Admin']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await inviteMutation.mutateAsync()
  }

  return (
    <Modal
      title="Invite user"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={inviteMutation.isPending} type="submit" form="invite-user-form">
            Send invite
          </Button>
        </>
      }
    >
      <form id="invite-user-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  )
}
