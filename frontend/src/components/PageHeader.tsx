import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted-strong)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text-strong)] sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)] sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
