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
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${paddingClass[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
