import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getOrganizations, createOrganization } from '../api/organizations'
import type { Organization, CreateOrganizationRequest } from '../types/api'
import Button from '../components/Button'
import Card from '../components/Card'
import Modal from '../components/Modal'
import Toast from '../components/Toast'

export default function DashboardPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const loadOrgs = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getOrganizations()
      setOrgs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrgs()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    try {
      const body: CreateOrganizationRequest = {
        name: createName.trim(),
        description: createDesc.trim() || undefined,
      }
      await createOrganization(body)
      setCreateOpen(false)
      setCreateName('')
      setCreateDesc('')
      setToast({ message: 'Organization created.', type: 'success' })
      loadOrgs()
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to create organization',
        type: 'error',
      })
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Organizations</h1>
        <Button onClick={() => setCreateOpen(true)}>Create Organization</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : orgs.length === 0 ? (
        <Card>
          <p className="text-gray-600 text-center py-8">
            You don't belong to any organizations yet. Create one to get started.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => setCreateOpen(true)}>Create Organization</Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Link key={org.id} to={`/organizations/${org.id}`}>
              <Card className="hover:border-primary-300 hover:shadow-md transition-shadow cursor-pointer h-full">
                <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                {org.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{org.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {org.memberCount} member{org.memberCount !== 1 ? 's' : ''}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {createOpen && (
        <Modal
          title="Create Organization"
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                loading={createLoading}
                type="submit"
                form="create-org-form"
              >
                Create
              </Button>
            </>
          }
        >
          <form id="create-org-form" onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="What does your organization do?"
              />
            </div>
          </form>
        </Modal>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
