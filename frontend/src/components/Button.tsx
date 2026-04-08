import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'border-transparent bg-[color:var(--accent)] text-white shadow-[0_16px_32px_rgba(24,79,191,0.18)] hover:bg-[color:var(--accent-strong)] focus:ring-[color:var(--accent)]',
  secondary:
    'border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--text-strong)] hover:bg-white focus:ring-[color:var(--accent)]',
  danger:
    'border-transparent bg-[color:var(--danger)] text-white shadow-[0_16px_28px_rgba(170,63,51,0.18)] hover:brightness-95 focus:ring-[color:var(--danger)]',
  ghost:
    'border-transparent bg-transparent text-[color:var(--text-muted)] hover:bg-[rgba(28,40,68,0.06)] hover:text-[color:var(--text-strong)] focus:ring-[color:var(--accent)]',
}

export default function Button({
  variant = 'primary',
  loading,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  )
}
