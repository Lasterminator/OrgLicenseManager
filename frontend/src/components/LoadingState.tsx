interface LoadingStateProps {
  label?: string
}

export default function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] px-6 text-center shadow-[var(--shadow-soft)]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--accent-soft)] border-t-[color:var(--accent)]" />
      <p className="text-sm text-[color:var(--text-muted)]">{label}</p>
    </div>
  )
}
