import Button from './Button'
import Modal from './Modal'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
  tone?: 'danger' | 'primary'
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
  loading,
  tone = 'primary',
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-[color:var(--text-muted)]">{description}</p>
    </Modal>
  )
}
