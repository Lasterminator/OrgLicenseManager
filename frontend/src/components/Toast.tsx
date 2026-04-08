import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

const typeStyles = {
  success: 'border-[rgba(29,107,79,0.14)] bg-[rgba(247,255,251,0.92)] text-[color:var(--success)]',
  error: 'border-[rgba(170,63,51,0.14)] bg-[rgba(255,249,248,0.94)] text-[color:var(--danger)]',
  info: 'border-[rgba(24,79,191,0.14)] bg-[rgba(246,250,255,0.94)] text-[color:var(--accent)]',
}

export default function Toast({
  message,
  type = 'info',
  onClose,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return (
    <div
      role="alert"
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border px-4 py-3 shadow-[0_20px_40px_rgba(22,28,41,0.16)] backdrop-blur-sm ${typeStyles[type]}`}
    >
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
