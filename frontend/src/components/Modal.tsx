import { ReactNode } from 'react'

interface ModalProps {
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}

export default function Modal({ title, children, onClose, footer }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-[rgba(20,25,38,0.48)] backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />
        <div className="relative w-full max-w-lg rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 shadow-[0_28px_80px_rgba(24,22,14,0.22)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[color:var(--text-strong)]">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg leading-none text-[color:var(--text-muted)] transition hover:bg-[rgba(28,40,68,0.06)] hover:text-[color:var(--text-strong)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="mb-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
