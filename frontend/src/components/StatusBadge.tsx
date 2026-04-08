interface StatusBadgeProps {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  children: string
}

const toneClasses: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  neutral: 'bg-[color:var(--chip-neutral-bg)] text-[color:var(--chip-neutral-text)]',
  success: 'bg-[color:var(--chip-success-bg)] text-[color:var(--chip-success-text)]',
  warning: 'bg-[color:var(--chip-warning-bg)] text-[color:var(--chip-warning-text)]',
  danger: 'bg-[color:var(--chip-danger-bg)] text-[color:var(--chip-danger-text)]',
  info: 'bg-[color:var(--chip-info-bg)] text-[color:var(--chip-info-text)]',
}

export default function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}
