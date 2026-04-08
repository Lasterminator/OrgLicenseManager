import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import { createOrganization, getOrganizations } from '../api/organizations'

const organizationsQueryKey = ['my-organizations']

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const organizationsQuery = useQuery({
    queryKey: organizationsQueryKey,
    queryFn: getOrganizations,
  })

  const createOrganizationMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: async () => {
      setCreateOpen(false)
      setCreateName('')
      setCreateDesc('')
      setToast({ message: 'Organization created.', type: 'success' })
      await queryClient.invalidateQueries({ queryKey: organizationsQueryKey })
    },
    onError: (error) => {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to create organization',
        type: 'error',
      })
    },
  })

  const organizations = organizationsQuery.data ?? []
  const filteredOrganizations = organizations.filter((org) => {
    const needle = deferredSearch.trim().toLowerCase()
    if (!needle) return true
    return (
      org.name.toLowerCase().includes(needle) ||
      (org.description ?? '').toLowerCase().includes(needle)
    )
  })

  const totalMembers = organizations.reduce((sum, org) => sum + org.memberCount, 0)
  const largestOrganization = organizations.reduce((largest, org) => {
    if (!largest || org.memberCount > largest.memberCount) return org
    return largest
  }, organizations[0])
  const describedOrganizations = organizations.filter((org) => org.description).length

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createOrganizationMutation.mutateAsync({
      name: createName.trim(),
      description: createDesc.trim() || undefined,
    })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Workspace overview"
        title="Your organization portfolio"
        description="Track the teams you belong to, spin up new workspaces, and jump into operational tasks quickly."
        actions={<Button onClick={() => setCreateOpen(true)}>Create organization</Button>}
      />

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Organizations" value={String(organizations.length)} hint="Your current tenant footprint." icon="◫" />
        <StatCard label="Visible members" value={String(totalMembers)} hint="Combined membership across your orgs." icon="◎" />
        <StatCard
          label="With descriptions"
          value={String(describedOrganizations)}
          hint={largestOrganization ? `Largest org: ${largestOrganization.name}` : 'Add your first org to get started.'}
          icon="↗"
        />
      </section>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Browse organizations</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
              Search by organization name or description and jump into the detail workspace.
            </p>
          </div>
          <div className="w-full max-w-md">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations…"
              className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-sm text-[color:var(--text-strong)] shadow-sm outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
            />
          </div>
        </div>
      </Card>

      {organizationsQuery.isLoading ? (
        <LoadingState label="Loading your organizations…" />
      ) : organizationsQuery.isError ? (
        <EmptyState
          title="Couldn’t load organizations"
          description={
            organizationsQuery.error instanceof Error
              ? organizationsQuery.error.message
              : 'Please refresh and try again.'
          }
          action={<Button onClick={() => organizationsQuery.refetch()}>Retry</Button>}
        />
      ) : filteredOrganizations.length === 0 ? (
        <EmptyState
          title={organizations.length === 0 ? 'No organizations yet' : 'No matches found'}
          description={
            organizations.length === 0
              ? 'Create your first organization to start inviting teammates and managing licenses.'
              : 'Try a different search term or create a new organization.'
          }
          action={<Button onClick={() => setCreateOpen(true)}>Create organization</Button>}
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrganizations.map((org) => (
            <Link key={org.id} to={`/organizations/${org.id}`} className="group">
              <Card className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[color:var(--border-strong)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">
                      Organization
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
                      {org.name}
                    </h3>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
                    →
                  </div>
                </div>
                <p className="mt-5 min-h-[72px] text-sm leading-6 text-[color:var(--text-muted)]">
                  {org.description ?? 'No description yet. Open the workspace to add context and start collaborating.'}
                </p>
                <div className="mt-6 flex items-center justify-between text-sm text-[color:var(--text-muted)]">
                  <span>{org.memberCount} member{org.memberCount === 1 ? '' : 's'}</span>
                  <span>Open workspace</span>
                </div>
              </Card>
            </Link>
          ))}
        </section>
      )}

      {createOpen && (
        <Modal
          title="Create organization"
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                loading={createOrganizationMutation.isPending}
                type="submit"
                form="create-org-form"
              >
                Create workspace
              </Button>
            </>
          }
        >
          <form id="create-org-form" onSubmit={handleCreate} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Name</span>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
                placeholder="Acme Labs"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Description</span>
              <textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
                placeholder="What is this workspace for?"
              />
            </label>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
