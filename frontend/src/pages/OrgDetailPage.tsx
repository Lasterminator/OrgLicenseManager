import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import { deleteOrganization, getOrgLicenses, getOrganization } from '../api/organizations'
import { getMyOrganization } from '../api/memberships'
import { useAuth } from '../contexts/AuthContext'
import EditOrganizationModal from '../features/organizations/EditOrganizationModal'
import MyAccessCard from '../features/organizations/MyAccessCard'
import OrganizationInvitationsTab from '../features/organizations/OrganizationInvitationsTab'
import OrganizationLicensesTab from '../features/organizations/OrganizationLicensesTab'
import OrganizationMembersTab from '../features/organizations/OrganizationMembersTab'
import { organizationQueryKeys } from '../features/organizations/queryKeys'

type TabId = 'licenses' | 'members' | 'invitations'

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('licenses')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const organizationQuery = useQuery({
    queryKey: orgId ? organizationQueryKeys.detail(orgId) : ['organization-missing'],
    queryFn: () => getOrganization(orgId!),
    enabled: Boolean(orgId),
  })

  const membershipQuery = useQuery({
    queryKey: orgId ? organizationQueryKeys.membership(orgId) : ['organization-membership-missing'],
    queryFn: () => getMyOrganization(orgId!),
    enabled: Boolean(orgId),
  })

  const currentUserLicenseQuery = useQuery({
    queryKey:
      orgId && user?.email
        ? organizationQueryKeys.licenses(orgId, 1, user.email)
        : ['organization-license-self-missing'],
    queryFn: () =>
      getOrgLicenses(orgId!, {
        page: 1,
        pageSize: 20,
        search: user?.email,
      }),
    enabled: Boolean(orgId && user?.email),
    select: (result) =>
      result.items.find(
        (license) => license.assignedToEmail?.toLowerCase() === user?.email?.toLowerCase()
      ) ?? null,
  })

  const deleteOrganizationMutation = useMutation({
    mutationFn: () => deleteOrganization(orgId!),
    onSuccess: async () => {
      setToast({ message: 'Organization deleted.', type: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['my-organizations'] })
      navigate('/organizations', { replace: true })
    },
    onError: (error) => {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to delete organization',
        type: 'error',
      })
    },
  })

  const isLoading = organizationQuery.isLoading || membershipQuery.isLoading
  const hasError = organizationQuery.isError || membershipQuery.isError
  const errorMessage =
    organizationQuery.error instanceof Error
      ? organizationQuery.error.message
      : membershipQuery.error instanceof Error
        ? membershipQuery.error.message
        : 'Failed to load this organization.'

  if (!orgId) {
    return (
      <EmptyState
        title="Organization not found"
        description="The URL is missing an organization identifier."
        action={<Button onClick={() => navigate('/organizations')}>Back to organizations</Button>}
      />
    )
  }

  if (isLoading) {
    return <LoadingState label="Loading organization workspace…" />
  }

  if (hasError || !organizationQuery.data || !membershipQuery.data) {
    return (
      <EmptyState
        title="Couldn’t load organization"
        description={errorMessage}
        action={<Button onClick={() => navigate('/organizations')}>Back to organizations</Button>}
      />
    )
  }

  const organization = organizationQuery.data
  const membership = membershipQuery.data
  const viewerRole = membership.role
  const canManage = viewerRole === 'Owner' || viewerRole === 'Admin'
  const canDelete = viewerRole === 'Owner'

  const visibleTabs = canManage
    ? (['members', 'invitations', 'licenses'] as TabId[])
    : (['licenses'] as TabId[])
  const currentTab = visibleTabs.includes(activeTab) ? activeTab : 'licenses'

  const currentLicense = currentUserLicenseQuery.data
  const licenseSummary = !currentLicense
    ? 'No personal license assigned yet.'
    : currentLicense.isExpired
      ? 'Your assigned license is expired.'
      : `Your license expires ${new Date(currentLicense.expiresAt).toLocaleDateString()}.`

  return (
    <div>
      <Link to="/organizations" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent)]">
        ← Back to organizations
      </Link>

      <PageHeader
        eyebrow="Organization workspace"
        title={organization.name}
        description={
          organization.description ??
          'This workspace is ready for members, invitations, and license operations.'
        }
        actions={
          canManage ? (
            <>
              <EditOrganizationModal org={organization} />
              {canDelete && (
                <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                  Delete organization
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Members" value={String(organization.memberCount)} hint="Current organization size." icon="◎" />
        <StatCard label="Your role" value={membership.role} hint="Role-based access controls are enforced in the UI and API." icon="⌘" />
        <StatCard
          label="Access summary"
          value={canManage ? 'Manage' : 'Read only'}
          hint={licenseSummary}
          icon={canManage ? '⚙' : '◌'}
        />
      </section>

      <div className="mb-8">
        <MyAccessCard membership={membership} assignedLicense={currentLicense} />
      </div>

      <div className="mb-6 border-b border-[color:var(--border)]">
        <nav className="flex flex-wrap gap-3">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-t-2xl px-4 py-3 text-sm font-semibold capitalize transition ${
                currentTab === tab
                  ? 'bg-[color:var(--surface)] text-[color:var(--text-strong)]'
                  : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-strong)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {currentTab === 'licenses' && <OrganizationLicensesTab orgId={orgId} />}
      {currentTab === 'members' && canManage && (
        <OrganizationMembersTab
          orgId={orgId}
          viewerRole={viewerRole as 'Owner' | 'Admin'}
          currentUserEmail={user?.email}
        />
      )}
      {currentTab === 'invitations' && canManage && (
        <OrganizationInvitationsTab
          orgId={orgId}
          viewerRole={viewerRole as 'Owner' | 'Admin'}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete organization"
          description={`Delete ${organization.name}? This removes the organization, memberships, invitations, and licenses tied to it.`}
          confirmLabel="Delete organization"
          tone="danger"
          loading={deleteOrganizationMutation.isPending}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => deleteOrganizationMutation.mutate()}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
