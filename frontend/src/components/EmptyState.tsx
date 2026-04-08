import type { ReactNode } from 'react'
import Card from './Card'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <div className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </Card>
  )
}
