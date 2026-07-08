import { useState, useMemo } from 'react'
import { Search, Plus, Minus, Edit2, Ban, Filter, MoreHorizontal, User, ShieldAlert, ArrowLeft } from 'lucide-react'
import type { Member } from './adminTypes'
import StatusBadge from './StatusBadge'
import AdminModal, { FormField, inputCls } from './AdminModal'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  members: Member[]
  loading: boolean
  search: string
  planFilter: string
  statusFilter: string
  onSearchChange: (v: string) => void
  onPlanFilterChange: (v: string) => void
  onStatusFilterChange: (v: string) => void
  onSearch: () => void
  onRefresh: () => void
}

type ModalMode = 'manage' | 'add_credits' | 'remove_credits' | 'set_credits' | 'cancel_sub' | null

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const planColors: Record<string, string> = {
  free:    'bg-slate-100 text-slate-600 border-slate-200/60',
  starter: 'bg-blue-50 text-blue-700 border-blue-200/60',
  pro:     'bg-violet-50 text-violet-700 border-violet-200/60',
  agency:  'bg-indigo-50 text-indigo-700 border-indigo-200/60',
}

export default function MembersTab({ members, loading, search, planFilter, statusFilter, onSearchChange, onPlanFilterChange, onStatusFilterChange, onSearch, onRefresh }: Props) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [zeroCredits, setZeroCredits] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stats = useMemo(() => {
    const total = members.length
    const activePaid = members.filter(m => m.plan_id !== 'free' && m.subscription_status === 'active').length
    const freeUsers = members.filter(m => m.plan_id === 'free').length
    const totalCredits = members.reduce((sum, m) => sum + (m.balance || 0), 0)
    return { total, activePaid, freeUsers, totalCredits }
  }, [members])

  const openModal = (mode: ModalMode, member: Member | null = null) => {
    if (member) setSelectedMember(member)
    setModalMode(mode)
    setAmount('')
    setReason('')
    setZeroCredits(false)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!supabase || !selectedMember) return
    setError(null)
    setSaving(true)
    try {
      if (modalMode === 'add_credits' || modalMode === 'remove_credits') {
        let delta = parseInt(amount, 10)
        if (isNaN(delta) || delta <= 0) throw new Error('Enter a valid amount greater than 0')
        if (modalMode === 'remove_credits') delta = -delta
        const { error } = await supabase.rpc('admin_adjust_user_credits', { p_user_id: selectedMember.user_id, p_delta: delta, p_reason: reason || null })
        if (error) throw error
      } else if (modalMode === 'set_credits') {
        const val = parseInt(amount, 10)
        if (isNaN(val) || val < 0) throw new Error('Enter a valid non-negative balance')
        const { error } = await supabase.rpc('admin_set_user_credits', { p_user_id: selectedMember.user_id, p_new_balance: val, p_reason: reason || null })
        if (error) throw error
      } else if (modalMode === 'cancel_sub') {
        const { error } = await supabase.rpc('admin_cancel_user_subscription', { p_user_id: selectedMember.user_id, p_reason: reason || null, p_zero_credits: zeroCredits })
        if (error) throw error
      }
      setModalMode('manage') // Return to manage mode after action
      onRefresh()
    } catch (err: any) {
      setError(err.message || 'Action failed')
    } finally {
      setSaving(false)
    }
  }

  const modalTitles: Record<string, string> = {
    manage: 'Manage Member',
    add_credits: 'Add Credits',
    remove_credits: 'Remove Credits',
    set_credits: 'Set Credit Balance',
    cancel_sub: 'Cancel Subscription',
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: stats.total.toLocaleString() },
          { label: 'Active Paid', value: stats.activePaid.toLocaleString() },
          { label: 'Free Users', value: stats.freeUsers.toLocaleString() },
          { label: 'Total Credits Pool', value: stats.totalCredits.toLocaleString() },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-none flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-white">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or ID…"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch()}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={planFilter}
                onChange={e => onPlanFilterChange(e.target.value)}
                className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="agency">Agency</option>
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={e => onStatusFilterChange(e.target.value)}
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={onSearch}
              className="px-5 py-2.5 text-sm font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow-sm hover:shadow transition-all active:scale-[0.99]"
            >
              Search
            </button>
          </div>
        </div>
        <div className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr_auto] gap-4 px-6 py-3.5 bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
          <span>User Details</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Credits Allocation</span>
          <span>Renewal</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />)}
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-3 border border-slate-200">
              <Search size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No members found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map(m => {
              const pColor = planColors[m.plan_id] ?? planColors.free;
              const isZero = m.monthly_allocation === 0;
              const pct = isZero ? 0 : Math.min(100, Math.max(0, (m.balance / m.monthly_allocation) * 100));
              
              return (
                <div key={m.user_id} className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr_auto] gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors items-center group">
                  {/* User */}
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="w-8 h-8 mt-0.5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase flex-shrink-0">
                      {m.full_name ? m.full_name.substring(0, 2) : m.email.substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <p className="font-semibold text-slate-900 text-sm truncate">{m.full_name || '—'}</p>
                      <p className="text-xs text-slate-600 truncate">{m.email}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{m.phone_number || 'No phone'}</p>
                    </div>
                  </div>

                  {/* Plan */}
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest border ${pColor}`}>
                      {m.plan_id}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={m.subscription_status} />
                  </div>

                  {/* Credits */}
                  <div className="pr-4">
                    <div className="flex items-end justify-between mb-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-900">{m.balance.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 font-medium">/ {m.monthly_allocation.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{Math.round(pct)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct < 20 ? 'bg-red-500' : pct < 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Renewal */}
                  <div className="text-xs font-medium text-slate-500">
                    {m.subscription_status === 'cancelled' ? '—' : formatDate(m.current_period_end)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => openModal('manage', m)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 active:scale-[0.99] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AdminModal
        open={!!modalMode}
        title={modalMode ? modalTitles[modalMode] : ''}
        description={modalMode === 'manage' ? 'View details and perform administrative actions' : selectedMember?.email}
        onClose={() => !saving && setModalMode(null)}
        onConfirm={modalMode !== 'manage' ? handleSubmit : undefined}
        confirmLabel={modalMode === 'cancel_sub' ? 'Confirm Cancellation' : 'Save Changes'}
        confirmVariant={modalMode === 'cancel_sub' ? 'danger' : 'primary'}
        loading={saving}
        error={error}
        size={modalMode === 'manage' ? 'lg' : 'md'}
      >
        {modalMode === 'manage' && selectedMember && (
          <div className="space-y-6">
            {/* Member Details */}
            <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account Information</p>
                <p className="text-sm font-semibold text-slate-900">{selectedMember.full_name || '—'}</p>
                <p className="text-xs text-slate-600 mt-0.5">{selectedMember.email}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedMember.phone_number || 'Not provided'}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1" title={selectedMember.user_id}>ID: {selectedMember.user_id.substring(0, 8)}...</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subscription</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest border ${planColors[selectedMember.plan_id] ?? planColors.free}`}>
                    {selectedMember.plan_id}
                  </span>
                  <StatusBadge status={selectedMember.subscription_status} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Credits</p>
                <p className="text-sm font-semibold text-slate-900">{selectedMember.balance.toLocaleString()} <span className="text-slate-400 font-normal">/ {selectedMember.monthly_allocation.toLocaleString()}</span></p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Renewal Date</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(selectedMember.current_period_end)}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <p className="text-sm font-bold text-slate-900 mb-3">Administrative Actions</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => openModal('add_credits')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all text-left group">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-green-800">Add Credits</p>
                    <p className="text-[11px] text-slate-500">Increase current balance</p>
                  </div>
                </button>
                <button onClick={() => openModal('remove_credits')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all text-left group">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Minus size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-800">Remove Credits</p>
                    <p className="text-[11px] text-slate-500">Decrease current balance</p>
                  </div>
                </button>
                <button onClick={() => openModal('set_credits')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Edit2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-800">Set Balance</p>
                    <p className="text-[11px] text-slate-500">Override exact credits</p>
                  </div>
                </button>
                {selectedMember.subscription_status !== 'cancelled' && (
                  <button onClick={() => openModal('cancel_sub')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all text-left group">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Ban size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-red-800">Cancel Sub</p>
                      <p className="text-[11px] text-slate-500">Revoke active plan</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {modalMode && modalMode !== 'manage' && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => openModal('manage')}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Member Details
            </button>

            {(modalMode === 'add_credits' || modalMode === 'remove_credits' || modalMode === 'set_credits') && (
              <FormField label={modalMode === 'set_credits' ? 'New Balance' : 'Amount'}>
                <input
                  type="number"
                  min="0"
                  className={inputCls}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  autoFocus
                />
              </FormField>
            )}
            
            {modalMode === 'cancel_sub' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
                  <ShieldAlert size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800 leading-relaxed">
                    You are about to cancel this user's subscription. They will be downgraded to the free plan immediately.
                  </p>
                </div>
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors bg-white">
                  <input
                    type="checkbox"
                    checked={zeroCredits}
                    onChange={e => setZeroCredits(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-red-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900 block">Zero out credits</span>
                    <span className="text-xs text-slate-500">Set balance and monthly allocation to 0</span>
                  </div>
                </label>
              </div>
            )}

            <FormField label="Reason for Audit Log (Optional)">
              <input
                type="text"
                className={inputCls}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. User requested via support"
              />
            </FormField>
          </div>
        )}
      </AdminModal>
    </div>
  )
}
