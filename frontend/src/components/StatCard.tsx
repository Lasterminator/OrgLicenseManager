import type { ReactNode } from 'react'
import Card from './Card'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
}

export default function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--text-strong)]">
            {value}
          </p>
          {hint && <p className="mt-3 text-sm text-[color:var(--text-muted)]">{hint}</p>}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-lg text-[color:var(--accent)]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
