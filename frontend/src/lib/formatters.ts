const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

export function formatRelativeDays(value: string) {
  const diffMs = new Date(value).getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'
  if (diffDays > 1) return `in ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}
