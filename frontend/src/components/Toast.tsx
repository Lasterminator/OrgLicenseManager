import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

const typeStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
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
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg border ${typeStyles[type]} shadow-lg max-w-sm`}
    >
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
