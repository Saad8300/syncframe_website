import { Link } from 'react-router-dom'
import {
  FileText, Users, Tag, Settings, CreditCard,
  LayoutDashboard, ArrowLeft, Shield, Zap, DownloadCloud, BookOpen
} from 'lucide-react'
import SyncFrameLogo from '../SyncFrameLogo'

export type TabId = 'overview' | 'requests' | 'members' | 'coupons' | 'plans' | 'accounts' | 'releases' | 'changelog'

interface AdminSidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  pendingCount: number
  adminEmail: string
}

const navSections = [
  {
    title: 'Dashboard',
    items: [
      { id: 'overview',  label: 'Overview',          icon: <LayoutDashboard size={18} /> },
    ]
  },
  {
    title: 'Management',
    items: [
      { id: 'requests',  label: 'Payment Requests',   icon: <FileText size={18} /> },
      { id: 'members',   label: 'Members',            icon: <Users size={18} /> },
    ]
  },
  {
    title: 'Commerce',
    items: [
      { id: 'coupons',   label: 'Coupons',            icon: <Tag size={18} /> },
      { id: 'plans',     label: 'Plan Pricing',       icon: <Settings size={18} /> },
      { id: 'accounts',  label: 'Payment Accounts',   icon: <CreditCard size={18} /> },
    ]
  },
  {
    title: 'Product',
    items: [
      { id: 'releases',  label: 'App Releases',       icon: <DownloadCloud size={18} /> },
      { id: 'changelog', label: 'Changelog',          icon: <BookOpen size={18} /> },
    ]
  }
]

export default function AdminSidebar({ activeTab, onTabChange, pendingCount, adminEmail }: AdminSidebarProps) {
  return (
    <aside className="w-[232px] flex-shrink-0 h-dvh bg-white flex flex-col z-40 relative">
      {/* Logo Area */}
      <div className="p-5">
        <SyncFrameLogo size="admin" subtitle="ADMIN CONSOLE" theme="light" linkTo={null} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar overscroll-contain">
        {navSections.map(section => (
          <div key={section.title}>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map(item => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id as TabId)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <span className={`${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'} transition-colors`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    
                    {item.id === 'requests' && pendingCount > 0 && (
                      <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="mb-4 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
            {adminEmail.slice(0, 2)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-medium text-slate-900 truncate">{adminEmail}</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Shield size={10} className="text-green-500" /> Secure Session
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 bg-slate-50 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ArrowLeft size={14} className="text-slate-400" />
            Exit to Website
          </div>
        </Link>
      </div>
    </aside>
  )
}
