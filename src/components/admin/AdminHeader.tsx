import { RefreshCw } from 'lucide-react'

interface AdminHeaderProps {
  title: string
  description?: string
  onRefresh: () => void
  refreshing: boolean
  actions?: React.ReactNode
}

export default function AdminHeader({ title, description, onRefresh, refreshing, actions }: AdminHeaderProps) {
  return (
    <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-none shadow-gray-100/50">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1 font-medium">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-none transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={`${refreshing ? 'animate-spin text-indigo-500' : 'text-slate-400'}`} />
          Refresh
        </button>
      </div>
    </div>
  )
}
