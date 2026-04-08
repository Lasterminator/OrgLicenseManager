import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md'
}

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
}

export default function Card({
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] backdrop-blur-sm shadow-[var(--shadow-soft)] ${paddingClass[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
