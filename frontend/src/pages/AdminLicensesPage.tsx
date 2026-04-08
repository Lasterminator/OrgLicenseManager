import { useDeferredValue, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  cancelLicense,
  createLicense,
  getAdminOrganizations,
  getAllLicenses,
  getLicenseSettings,
  updateLicense,
  updateLicenseSettings,
} from '../api/admin'
import type { License } from '../types/api'
import Button from '../components/Button'
import Card from '../components/Card'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import { formatDateTime, formatRelativeDays } from '../lib/formatters'

const licenseQueryKey = (page: number, search: string) => ['admin-licenses', page, search]

export default function AdminLicensesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [createOpen, setCreateOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [revokingLicense, setRevokingLicense] = useState<License | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const licensesQuery = useQuery({
    queryKey: licenseQueryKey(page, deferredSearch),
    queryFn: () =>
      getAllLicenses({
        page,
        pageSize: 10,
        sortBy: 'expiresAt',
        sortDescending: false,
        search: deferredSearch.trim() || undefined,
      }),
  })

  const revokeLicenseMutation = useMutation({
    mutationFn: cancelLicense,
    onSuccess: async () => {
      setRevokingLicense(null)
      setToast({ message: 'License revoked.', type: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['admin-licenses'] })
    },
    onError: (error) => {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to revoke license',
        type: 'error',
      })
    },
  })

  const licenses = licensesQuery.data?.items ?? []
  const activeCount = licenses.filter((license) => license.isActive).length
  const expiringSoon = licenses.filter((license) => {
    const diff = new Date(license.expiresAt).getTime() - Date.now()
    return license.isActive && diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7
  }).length
  const autoRenewingCount = licenses.filter((license) => license.autoRenewal).length

  return (
    <div>
      <PageHeader
        eyebrow="Admin controls"
        title="License operations"
        description="Search across every organization, adjust renewal settings, and create licenses for any tenant from one place."
        actions={
          <>
            <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
              Renewal settings
            </Button>
            <Button onClick={() => setCreateOpen(true)}>Create license</Button>
          </>
        }
      />

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Visible rows" value={String(licenses.length)} hint="Current page of license inventory." icon="◌" />
        <StatCard label="Active" value={String(activeCount)} hint={`${expiringSoon} expiring within seven days.`} icon="↺" />
        <StatCard label="Auto-renew" value={String(autoRenewingCount)} hint="Licenses set to renew automatically." icon="∞" />
      </section>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Global license inventory</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
              Search by organization name or assignee email and drill into the matching workspace.
            </p>
          </div>
          <div className="w-full max-w-md">
            <input
              type="search"
              placeholder="Search organization or assignee…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-sm text-[color:var(--text-strong)] shadow-sm outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
            />
          </div>
        </div>
      </Card>

      {licensesQuery.isLoading ? (
        <LoadingState label="Loading license inventory…" />
      ) : licensesQuery.isError ? (
        <EmptyState
          title="Couldn’t load licenses"
          description={
            licensesQuery.error instanceof Error
              ? licensesQuery.error.message
              : 'Please refresh and try again.'
          }
          action={<Button onClick={() => licensesQuery.refetch()}>Retry</Button>}
        />
      ) : licenses.length === 0 ? (
        <EmptyState
          title="No licenses found"
          description="Try a different search term or create a new license for one of your organizations."
          action={<Button onClick={() => setCreateOpen(true)}>Create license</Button>}
        />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[color:var(--border)]">
              <thead className="bg-[rgba(255,255,255,0.45)]">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Organization</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Assignee</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Expires</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Status</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {licenses.map((license) => (
                  <tr key={license.id}>
                    <td className="px-5 py-4 align-top">
                      <Link
                        to={`/organizations/${license.organizationId}`}
                        className="font-semibold text-[color:var(--text-strong)] transition hover:text-[color:var(--accent)]"
                      >
                        {license.organizationName}
                      </Link>
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">{license.organizationId}</p>
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
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone={license.isActive ? 'success' : 'neutral'}>
                          {license.isActive ? 'Active' : 'Revoked'}
                        </StatusBadge>
                        {license.isExpired && license.isActive && (
                          <StatusBadge tone="warning">Expired</StatusBadge>
                        )}
                        {license.autoRenewal && <StatusBadge tone="info">Auto-renew</StatusBadge>}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-right">
                      <div className="flex justify-end gap-2">
                        {license.isActive && (
                          <>
                            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => setEditingLicense(license)}>
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="px-3 py-2 text-xs text-[color:var(--danger)]"
                              onClick={() => setRevokingLicense(license)}
                            >
                              Revoke
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      )}

      {createOpen && (
        <CreateLicenseModal
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false)
            setToast({ message: 'License created.', type: 'success' })
            await queryClient.invalidateQueries({ queryKey: ['admin-licenses'] })
          }}
          onError={(message) => setToast({ message, type: 'error' })}
        />
      )}

      {settingsOpen && (
        <LicenseSettingsModal
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {
            setSettingsOpen(false)
            setToast({ message: 'License settings updated.', type: 'success' })
          }}
          onError={(message) => setToast({ message, type: 'error' })}
        />
      )}

      {editingLicense && (
        <EditLicenseModal
          license={editingLicense}
          onClose={() => setEditingLicense(null)}
          onSaved={async () => {
            setEditingLicense(null)
            setToast({ message: 'License updated.', type: 'success' })
            await queryClient.invalidateQueries({ queryKey: ['admin-licenses'] })
          }}
          onError={(message) => setToast({ message, type: 'error' })}
        />
      )}

      {revokingLicense && (
        <ConfirmDialog
          title="Revoke license"
          description={`This will revoke the license for ${revokingLicense.organizationName} and disable auto-renewal.`}
          confirmLabel="Revoke license"
          tone="danger"
          loading={revokeLicenseMutation.isPending}
          onCancel={() => setRevokingLicense(null)}
          onConfirm={() => revokeLicenseMutation.mutate(revokingLicense.id)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

function EditLicenseModal({
  license,
  onClose,
  onSaved,
  onError,
}: {
  license: License
  onClose: () => void
  onSaved: () => Promise<void> | void
  onError: (message: string) => void
}) {
  const [expiresAt, setExpiresAt] = useState(license.expiresAt.slice(0, 16))
  const [autoRenewal, setAutoRenewal] = useState(license.autoRenewal)

  const updateLicenseMutation = useMutation({
    mutationFn: () =>
      updateLicense(license.id, {
        expiresAt: new Date(expiresAt).toISOString(),
        autoRenewal,
      }),
    onSuccess: onSaved,
    onError: (error) => {
      onError(error instanceof Error ? error.message : 'Failed to update license')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateLicenseMutation.mutateAsync()
  }

  return (
    <Modal
      title={`Edit license for ${license.organizationName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={updateLicenseMutation.isPending} type="submit" form="edit-license-form">
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-license-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Expires at</span>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            required
            className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
          />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/70 px-4 py-3">
          <input
            type="checkbox"
            checked={autoRenewal}
            onChange={(e) => setAutoRenewal(e.target.checked)}
            className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--accent)] focus:ring-[color:var(--accent)]"
          />
          <span className="text-sm text-[color:var(--text-strong)]">Auto-renew when expired</span>
        </label>
      </form>
    </Modal>
  )
}

function CreateLicenseModal({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void
  onCreated: () => Promise<void> | void
  onError: (message: string) => void
}) {
  const [orgId, setOrgId] = useState('')
  const [orgSearch, setOrgSearch] = useState('')
  const deferredOrgSearch = useDeferredValue(orgSearch)
  const [autoRenewal, setAutoRenewal] = useState(true)

  const organizationsQuery = useQuery({
    queryKey: ['admin-organizations', deferredOrgSearch],
    queryFn: () =>
      getAdminOrganizations({
        pageSize: 20,
        sortBy: 'name',
        search: deferredOrgSearch.trim() || undefined,
      }),
  })

  const createLicenseMutation = useMutation({
    mutationFn: () => createLicense(orgId, { autoRenewal }),
    onSuccess: onCreated,
    onError: (error) => {
      onError(error instanceof Error ? error.message : 'Failed to create license')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) return
    await createLicenseMutation.mutateAsync()
  }

  return (
    <Modal
      title="Create license"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={createLicenseMutation.isPending}
            type="submit"
            form="create-license-form"
            disabled={!orgId}
          >
            Create license
          </Button>
        </>
      }
    >
      <form id="create-license-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Find organization</span>
          <input
            type="search"
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
            placeholder="Search by organization name…"
            className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Organization</span>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            required
            className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
          >
            <option value="">Select organization</option>
            {(organizationsQuery.data?.items ?? []).map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
        {organizationsQuery.isLoading && (
          <p className="text-sm text-[color:var(--text-muted)]">Loading organizations…</p>
        )}
        {organizationsQuery.isError && (
          <p className="text-sm text-[color:var(--danger)]">
            {organizationsQuery.error instanceof Error
              ? organizationsQuery.error.message
              : 'Failed to load organizations'}
          </p>
        )}
        <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/70 px-4 py-3">
          <input
            type="checkbox"
            checked={autoRenewal}
            onChange={(e) => setAutoRenewal(e.target.checked)}
            className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--accent)] focus:ring-[color:var(--accent)]"
          />
          <span className="text-sm text-[color:var(--text-strong)]">Auto-renew when expired</span>
        </label>
      </form>
    </Modal>
  )
}

function LicenseSettingsModal({
  onClose,
  onSaved,
  onError,
}: {
  onClose: () => void
  onSaved: () => void
  onError: (message: string) => void
}) {
  const settingsQuery = useQuery({
    queryKey: ['license-settings'],
    queryFn: getLicenseSettings,
  })
  const [minutes, setMinutes] = useState(10)

  useEffect(() => {
    if (settingsQuery.data) {
      setMinutes(settingsQuery.data.expirationMinutes)
    }
  }, [settingsQuery.data])

  const updateSettingsMutation = useMutation({
    mutationFn: () => updateLicenseSettings(minutes),
    onSuccess: onSaved,
    onError: (error) => {
      onError(error instanceof Error ? error.message : 'Failed to update settings')
    },
  })

  return (
    <Modal
      title="Renewal settings"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={updateSettingsMutation.isPending}
            onClick={() => updateSettingsMutation.mutate()}
          >
            Save settings
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-[color:var(--text-muted)]">
          New licenses and automatic renewals use this duration in minutes.
        </p>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">
            Default expiration window
          </span>
          <input
            type="number"
            min={1}
            max={525600}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
          />
        </label>
        {settingsQuery.isLoading && <p className="text-sm text-[color:var(--text-muted)]">Loading current settings…</p>}
      </div>
    </Modal>
  )
}
