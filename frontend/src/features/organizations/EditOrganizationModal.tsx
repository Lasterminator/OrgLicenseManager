import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import { updateOrganization } from '../../api/organizations'
import type { Organization } from '../../types/api'
import { organizationQueryKeys } from './queryKeys'

interface EditOrganizationModalProps {
  org: Organization
}

export default function EditOrganizationModal({ org }: EditOrganizationModalProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(org.name)
  const [description, setDescription] = useState(org.description ?? '')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setName(org.name)
    setDescription(org.description ?? '')
  }, [org])

  const updateOrganizationMutation = useMutation({
    mutationFn: () =>
      updateOrganization(org.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: async () => {
      setOpen(false)
      setToast({ message: 'Organization updated.', type: 'success' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationQueryKeys.detail(org.id) }),
        queryClient.invalidateQueries({ queryKey: organizationQueryKeys.membership(org.id) }),
      ])
    },
    onError: (error) => {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to update organization',
        type: 'error',
      })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateOrganizationMutation.mutateAsync()
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Edit organization
      </Button>
      {open && (
        <Modal
          title="Edit organization"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button loading={updateOrganizationMutation.isPending} type="submit" form="edit-organization-form">
                Save changes
              </Button>
            </>
          }
        >
          <form id="edit-organization-form" onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
              />
            </label>
          </form>
        </Modal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
