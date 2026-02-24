import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getAllLicenses,
  createLicense,
  updateLicense,
  cancelLicense,
  getLicenseSettings,
  updateLicenseSettings,
} from '../api/admin'
import { getOrganizations } from '../api/organizations'
import type { License, Organization } from '../types/api'
import Button from '../components/Button'
import Card from '../components/Card'
import Modal from '../components/Modal'
import Toast from '../components/Toast'

export default function AdminLicensesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [data, setData] = useState<{
    items: License[]
    totalPages: number
    totalCount: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAllLicenses({
        page,
        pageSize: 10,
        sortBy: 'expiresAt',
        sortDescending: true,
        search: search.trim() || undefined,
      })
      setData({
        items: res.items,
        totalPages: res.totalPages,
        totalCount: res.totalCount,
      })
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to load licenses', type: 'error' })
      setData({ items: [], totalPages: 0, totalCount: 0 })
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin: Licenses</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="search"
          placeholder="Search by organization or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
            License settings
          </Button>
          <Button onClick={() => setCreateOpen(true)}>Create license</Button>
        </div>
      </div>

      <Card padding="none">
        {loading && !data ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned to</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto-renew</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(data?.items ?? []).map((l) => (
                    <LicenseRow
                      key={l.id}
                      license={l}
                      onUpdated={load}
                      onError={showToast}
                      onEdit={setEditingLicense}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.items.length === 0 && (
              <p className="p-6 text-gray-500 text-center">No licenses found.</p>
            )}
            {data && data.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {data.totalPages} ({data.totalCount} total)
                </span>
                <button
                  type="button"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {createOpen && (
        <CreateLicenseModal
          onCreated={() => {
            setCreateOpen(false)
            showToast('License created.', 'success')
            load()
          }}
          onClose={() => setCreateOpen(false)}
          onError={showToast}
        />
      )}

      {settingsOpen && (
        <LicenseSettingsModal
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {
            setSettingsOpen(false)
            showToast('Settings updated.', 'success')
          }}
          onError={showToast}
        />
      )}

      {editingLicense && (
        <EditLicenseModal
          license={editingLicense}
          onClose={() => setEditingLicense(null)}
          onSaved={() => {
            setEditingLicense(null)
            load()
            showToast('License updated.', 'success')
          }}
          onError={showToast}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}

function LicenseRow({
  license,
  onUpdated,
  onError,
  onEdit,
}: {
  license: License
  onUpdated: () => void
  onError: (msg: string, type: 'success' | 'error') => void
  onEdit: (license: License) => void
}) {
  const handleRevoke = async () => {
    if (!window.confirm('Revoke this license? It will no longer be active.')) return
    try {
      await cancelLicense(license.id)
      onError('License revoked.', 'success')
      onUpdated()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to revoke', 'error')
    }
  }

  return (
    <tr>
      <td className="px-4 py-3 text-sm text-gray-900">
        <Link to={`/organizations/${license.organizationId}`} className="text-primary-600 hover:underline">
          {license.organizationId.slice(0, 8)}…
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{license.assignedToEmail ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{new Date(license.expiresAt).toLocaleString()}</td>
      <td className="px-4 py-3 text-sm">
        <span
          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
            license.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {license.isActive ? 'Active' : 'Revoked'}
        </span>
        {license.isExpired && license.isActive && (
          <span className="ml-1 text-red-600 text-xs">Expired</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">{license.autoRenewal ? 'Yes' : 'No'}</td>
      <td className="px-4 py-3 text-right text-sm">
        {license.isActive && (
          <>
            <Button variant="ghost" className="text-xs py-1" onClick={() => onEdit(license)}>
              Edit
            </Button>
            <Button variant="ghost" className="text-xs py-1 text-red-600" onClick={handleRevoke}>
              Revoke
            </Button>
          </>
        )}
      </td>
    </tr>
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
  onSaved: () => void
  onError: (msg: string, type: 'success' | 'error') => void
}) {
  const [expiresAt, setExpiresAt] = useState(
    license.expiresAt.slice(0, 16) // datetime-local format
  )
  const [autoRenewal, setAutoRenewal] = useState(license.autoRenewal)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setExpiresAt(license.expiresAt.slice(0, 16))
    setAutoRenewal(license.autoRenewal)
  }, [license])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateLicense(license.id, {
        expiresAt: new Date(expiresAt).toISOString(),
        autoRenewal,
      })
      onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Update failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Edit license"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} type="submit" form="edit-license-form">
            Save
          </Button>
        </>
      }
    >
      <form id="edit-license-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expires at</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoRenewal"
            checked={autoRenewal}
            onChange={(e) => setAutoRenewal(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="autoRenewal" className="text-sm text-gray-700">Auto-renew when expired</label>
        </div>
      </form>
    </Modal>
  )
}

function CreateLicenseModal({
  onCreated,
  onClose,
  onError,
}: {
  onCreated: () => void
  onClose: () => void
  onError: (msg: string, type: 'success' | 'error') => void
}) {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [orgId, setOrgId] = useState('')
  const [autoRenewal, setAutoRenewal] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getOrganizations().then(setOrgs).catch(() => setOrgs([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) return
    setLoading(true)
    try {
      await createLicense(orgId, { autoRenewal })
      onCreated()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create license', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Create license"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} type="submit" form="create-license-form" disabled={!orgId}>
            Create
          </Button>
        </>
      }
    >
      <form id="create-license-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select organization</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="createAutoRenewal"
            checked={autoRenewal}
            onChange={(e) => setAutoRenewal(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="createAutoRenewal" className="text-sm text-gray-700">Auto-renew when expired</label>
        </div>
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
  onError: (msg: string, type: 'success' | 'error') => void
}) {
  const [minutes, setMinutes] = useState(10)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getLicenseSettings().then((s) => setMinutes(s.expirationMinutes)).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateLicenseSettings(minutes)
      onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="License settings"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} type="submit" form="settings-form">Save</Button>
        </>
      }
    >
      <form id="settings-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default expiration (minutes) for new/renewed licenses
          </label>
          <input
            type="number"
            min={1}
            max={525600}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </form>
    </Modal>
  )
}
