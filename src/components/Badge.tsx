import { type ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'indigo' | 'violet' | 'blue' | 'green' | 'amber' | 'rose'
  size?: 'sm' | 'md'
}

const variantClasses = {
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

export default function Badge({ children, variant = 'indigo', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium border rounded-full
        ${variantClasses[variant]}
        ${size === 'sm' ? 'text-xs px-3 py-1' : 'text-sm px-4 py-1.5'}
      `}
    >
      {children}
    </span>
  )
}
