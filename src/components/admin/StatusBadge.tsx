import { CheckCircle2, XCircle, Clock, Ban } from 'lucide-react'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const config: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  pending:   { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  icon: <Clock size={11} /> },
  approved:  { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  icon: <CheckCircle2 size={11} /> },
  rejected:  { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    icon: <XCircle size={11} /> },
  active:    { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  icon: <CheckCircle2 size={11} /> },
  trialing:  { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   icon: <Clock size={11} /> },
  cancelled: { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    icon: <Ban size={11} /> },
  inactive:  { bg: 'bg-slate-100',   text: 'text-slate-500',   border: 'border-slate-200',   icon: <Clock size={11} /> },
  free:      { bg: 'bg-slate-100',   text: 'text-slate-500',   border: 'border-slate-200',   icon: null },
  starter:   { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   icon: null },
  pro:       { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200', icon: null },
  agency:    { bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200', icon: null },
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const s = config[status] ?? config.inactive
  const padClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${s.bg} ${s.text} ${s.border} ${padClass}`}>
      {s.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
