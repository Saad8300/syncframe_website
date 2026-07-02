import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Users, FileText, CheckCircle2, XCircle, Clock,
  AlertCircle, RefreshCw, ChevronDown, ChevronUp, Info,
  Plus, Minus, Edit2, Ban, Search, Tag, CreditCard, Settings
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import PageHeader from '../components/PageHeader'
import Container from '../components/layout/Container'
import Section from '../components/layout/Section'

// Types
interface PaymentRequest {
  id: string
  user_id: string
  email: string
  full_name: string
  requested_plan: string
  amount_pkr: number
  base_amount_pkr?: number
  discount_amount_pkr?: number
  final_amount_pkr?: number
  coupon_code?: string
  payment_method: string
  transaction_reference: string
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
}

interface Member {
  user_id: string
  email: string
  created_at: string
  plan_id: string
  subscription_status: string
  current_period_start: string
  current_period_end: string
  balance: number
  monthly_allocation: number
  lifetime_used: number
  next_reset_at: string
  recent_usage_count: number
  last_usage_at: string
}

interface Plan {
  id: string
  display_name: string
  price_pkr: number
  price_label: string
  monthly_credits: number
  short_description: string
  is_popular: boolean
  public_visible: boolean
}

interface Coupon {
  id: string
  code: string
  description: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  applies_to_plan: string | null
  active: boolean
  expires_at: string | null
  max_redemptions: number | null
  redemption_count: number
  created_at: string
}

interface PaymentAccount {
  id: string
  method: string
  account_title: string
  account_number: string
  bank_name: string | null
  iban: string | null
  instructions: string | null
  active: boolean
  sort_order: number
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    trialing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock size={11} />,
    approved: <CheckCircle2 size={11} />,
    rejected: <XCircle size={11} />,
    active: <CheckCircle2 size={11} />,
    trialing: <Clock size={11} />,
    cancelled: <Ban size={11} />,
    inactive: <Clock size={11} />
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] || styles.pending}`}>
      {icons[status] || <Clock size={11} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return 'N/A'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  const [activeTab, setActiveTab] = useState<'requests' | 'members' | 'coupons' | 'plans' | 'accounts'>('requests')

  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])

  const [dataLoading, setDataLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  const [memberSearch, setMemberSearch] = useState('')
  const [memberPlanFilter, setMemberPlanFilter] = useState('all')
  const [memberStatusFilter, setMemberStatusFilter] = useState('all')

  // Modals state
  const [modalType, setModalType] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [modalData, setModalData] = useState<any>({})
  const [modalProcessing, setModalProcessing] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/admin' }, replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  useEffect(() => {
    if (!user || !supabase) return
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => {
        setIsAdmin(!error && !!data)
        setCheckingAdmin(false)
      })
  }, [user])

  const loadData = useCallback(async (manual = false) => {
    if (!isAdmin || !supabase) return
    if (manual) setRefreshing(true)
    else setDataLoading(true)
    setDataError(null)
    
    try {
      if (activeTab === 'requests') {
        let query = supabase.from('payment_requests').select('*').order('created_at', { ascending: false })
        if (statusFilter !== 'all') query = query.eq('status', statusFilter)
        const { data, error } = await query
        if (error) throw error
        setRequests(data ?? [])
      } else if (activeTab === 'members') {
        const { data, error } = await supabase.rpc('admin_list_members', {
          p_search: memberSearch || null,
          p_plan: memberPlanFilter || null,
          p_status: memberStatusFilter || null
        })
        if (error) throw error
        setMembers(data || [])
      } else if (activeTab === 'plans') {
        const { data, error } = await supabase.from('plans').select('*').order('sort_order', { ascending: true })
        if (error) throw error
        setPlans(data || [])
      } else if (activeTab === 'coupons') {
        const { data, error } = await supabase.rpc('admin_list_coupons')
        if (error) throw error
        setCoupons(data || [])
      } else if (activeTab === 'accounts') {
        const { data, error } = await supabase.rpc('admin_list_payment_accounts')
        if (error) throw error
        setAccounts(data || [])
      }
    } catch (err: any) {
      setDataError(err.message || 'Failed to load data.')
    } finally {
      setDataLoading(false)
      setRefreshing(false)
    }
  }, [isAdmin, activeTab, statusFilter, memberSearch, memberPlanFilter, memberStatusFilter])

  useEffect(() => {
    if (isAdmin) loadData()
  }, [loadData, isAdmin])

  const handleUpdateStatus = async (req: PaymentRequest, newStatus: 'approved' | 'rejected') => {
    if (!supabase || !user) return
    setActionError(null)
    setSuccessMessage(null)
    setProcessingId(req.id)
    try {
      const res = await supabase.rpc(newStatus === 'approved' ? 'approve_payment_request' : 'reject_payment_request', { p_request_id: req.id })
      if (res.error) throw res.error
      setSuccessMessage(newStatus === 'approved' ? 'Plan activated successfully' : 'Request rejected successfully')
      loadData(true)
    } catch (err: any) {
      setActionError(err.message || 'Failed to update status.')
    } finally {
      setProcessingId(null)
    }
  }

  const openModal = (type: string, entity: any = null) => {
    setModalType(type)
    setSelectedEntity(entity)
    setModalError(null)
    
    if (type === 'plan_edit') {
      setModalData({ ...entity })
    } else if (type === 'coupon_upsert') {
      setModalData(entity ? { ...entity } : { active: true, discount_type: 'percent', max_redemptions: null, expires_at: null, applies_to_plan: 'all' })
    } else if (type === 'account_upsert') {
      setModalData(entity ? { ...entity } : { active: true, method: 'Bank Transfer', sort_order: 0 })
    } else {
      setModalData({ check: true })
    }
    setExpandedId(null)
  }

  const handleModalSubmit = async () => {
    if (!supabase) return
    setModalProcessing(true)
    setModalError(null)
    setSuccessMessage(null)
    try {
      if (modalType === 'add_credits' || modalType === 'remove_credits') {
        let delta = parseInt(modalData.amount, 10)
        if (isNaN(delta) || delta <= 0) throw new Error('Valid amount required')
        if (modalType === 'remove_credits') delta = -delta
        const { error } = await supabase.rpc('admin_adjust_user_credits', { p_user_id: selectedEntity.user_id, p_delta: delta, p_reason: modalData.reason })
        if (error) throw error
      } else if (modalType === 'set_credits') {
        const val = parseInt(modalData.amount, 10)
        if (isNaN(val) || val < 0) throw new Error('Valid balance required')
        const { error } = await supabase.rpc('admin_set_user_credits', { p_user_id: selectedEntity.user_id, p_new_balance: val, p_reason: modalData.reason })
        if (error) throw error
      } else if (modalType === 'cancel_sub') {
        const { error } = await supabase.rpc('admin_cancel_user_subscription', { p_user_id: selectedEntity.user_id, p_reason: modalData.reason, p_zero_credits: modalData.check })
        if (error) throw error
      } else if (modalType === 'plan_edit') {
        const { error } = await supabase.rpc('admin_update_plan_settings', {
          p_plan_id: selectedEntity.id,
          p_price_pkr: parseInt(modalData.price_pkr, 10),
          p_monthly_credits: parseInt(modalData.monthly_credits, 10),
          p_display_name: modalData.display_name,
          p_short_description: modalData.short_description,
          p_is_popular: modalData.is_popular,
          p_public_visible: modalData.public_visible
        })
        if (error) throw error
      } else if (modalType === 'coupon_upsert') {
        const { error } = await supabase.rpc('admin_upsert_coupon', {
          p_id: selectedEntity?.id || null,
          p_code: modalData.code,
          p_description: modalData.description,
          p_discount_type: modalData.discount_type,
          p_discount_value: parseInt(modalData.discount_value, 10),
          p_applies_to_plan: modalData.applies_to_plan === 'all' ? null : modalData.applies_to_plan,
          p_active: modalData.active,
          p_expires_at: modalData.expires_at || null,
          p_max_redemptions: modalData.max_redemptions ? parseInt(modalData.max_redemptions, 10) : null
        })
        if (error) throw error
      } else if (modalType === 'account_upsert') {
        const { error } = await supabase.rpc('admin_upsert_payment_account', {
          p_id: selectedEntity?.id || null,
          p_method: modalData.method,
          p_account_title: modalData.account_title,
          p_account_number: modalData.account_number,
          p_bank_name: modalData.bank_name || null,
          p_iban: modalData.iban || null,
          p_instructions: modalData.instructions || null,
          p_active: modalData.active,
          p_sort_order: parseInt(modalData.sort_order, 10)
        })
        if (error) throw error
      }
      
      setSuccessMessage('Action completed successfully.')
      setModalType(null)
      loadData(true)
    } catch (err: any) {
      setModalError(err.message || 'Action failed')
    } finally {
      setModalProcessing(false)
    }
  }

  if (authLoading || checkingAdmin) {
    return <div className="w-full min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" /></div>
  }

  if (!isAdmin) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center py-20 px-4">
        <div className="text-center">
          <Shield size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-2xl mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm">You do not have admin access.</p>
        </div>
      </div>
    )
  }

  const pendingCount = activeTab === 'requests' ? requests.filter(r => r.status === 'pending').length : 0

  return (
    <div className="w-full flex flex-col relative min-h-screen">
      <PageHeader badge="Admin" badgeVariant="indigo" title="Admin Panel" description="Manage payments, members, pricing, and commerce settings." />

      <Section className="!pt-0">
        <Container className="max-w-6xl">
          {actionError && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-sm">{actionError}</p>
            </div>
          )}
          {successMessage && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-300 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4 border-b border-white/5 mb-6 overflow-x-auto whitespace-nowrap">
            {[
              { id: 'requests', label: 'Payment Requests', icon: <FileText size={16}/> },
              { id: 'members', label: 'Members', icon: <Users size={16}/> },
              { id: 'coupons', label: 'Coupons', icon: <Tag size={16}/> },
              { id: 'plans', label: 'Plan Pricing', icon: <Settings size={16}/> },
              { id: 'accounts', label: 'Payment Accounts', icon: <CreditCard size={16}/> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === tab.id ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                {tab.icon} {tab.label}
                {tab.id === 'requests' && pendingCount > 0 && <span className="ml-1.5 bg-amber-500 text-black px-1.5 py-0.5 rounded-full text-xs">{pendingCount}</span>}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              {/* Dynamic filters based on tab */}
              {activeTab === 'requests' && (
                <div className="flex gap-2">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${statusFilter === f ? 'bg-indigo-500 text-white' : 'glass text-slate-400'}`}>{f}</button>
                  ))}
                </div>
              )}
              {activeTab === 'members' && (
                <div className="flex gap-2 items-center">
                  <input type="text" placeholder="Search..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadData(true)} className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white" />
                  <select value={memberPlanFilter} onChange={e => setMemberPlanFilter(e.target.value)} className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"><option value="all">All Plans</option><option value="free">Free</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="agency">Agency</option></select>
                  <select value={memberStatusFilter} onChange={e => setMemberStatusFilter(e.target.value)} className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"><option value="all">All Status</option><option value="active">Active</option><option value="cancelled">Cancelled</option></select>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {activeTab === 'coupons' && <button onClick={() => openModal('coupon_upsert')} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-2"><Plus size={14}/> Create Coupon</button>}
              {activeTab === 'accounts' && <button onClick={() => openModal('account_upsert')} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-2"><Plus size={14}/> Add Account</button>}
              <button onClick={() => loadData(true)} disabled={refreshing} className="btn-ghost py-1.5 px-3 text-sm flex items-center gap-2"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh</button>
            </div>
          </div>

          {dataError && <div className="text-red-400 mb-6">{dataError}</div>}
          
          {dataLoading ? (
            <div className="space-y-3"><div className="h-20 bg-white/5 rounded-xl animate-pulse" /></div>
          ) : (
            <div>
              {/* REQUESTS */}
              {activeTab === 'requests' && requests.map(req => (
                <motion.div key={req.id} layout className={`mb-3 rounded-2xl border p-5 ${req.status === 'pending' ? 'border-amber-500/15 bg-amber-500/3' : 'border-white/5 glass'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-semibold flex items-center gap-2">{req.full_name} <StatusBadge status={req.status} /></p>
                      <p className="text-slate-400 text-sm mt-1">{req.email} — {req.requested_plan.toUpperCase()}</p>
                      <p className="text-slate-500 text-xs mt-1">Ref: {req.transaction_reference} · {formatDate(req.created_at)}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm font-bold text-white">Base: Rs {req.base_amount_pkr ?? req.amount_pkr}</span>
                        {req.discount_amount_pkr ? <span className="text-sm font-bold text-emerald-400">Discount: Rs {req.discount_amount_pkr} {req.coupon_code && `(${req.coupon_code})`}</span> : null}
                        <span className="text-sm font-bold text-indigo-300">Final: Rs {req.final_amount_pkr ?? req.amount_pkr}</span>
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus(req, 'approved')} disabled={!!processingId} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20">Approve</button>
                        <button onClick={() => handleUpdateStatus(req, 'rejected')} disabled={!!processingId} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20">Reject</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* MEMBERS */}
              {activeTab === 'members' && members.map(member => (
                <motion.div key={member.user_id} className="mb-3 rounded-2xl border border-white/5 glass p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-semibold flex items-center gap-2">{member.email} <StatusBadge status={member.subscription_status} /> <span className="bg-white/10 px-2 py-0.5 rounded text-xs">{member.plan_id}</span></p>
                      <p className="text-slate-500 text-xs font-mono mt-1">{member.user_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{member.balance.toLocaleString()} <span className="text-slate-400 text-xs font-normal">/ {member.monthly_allocation.toLocaleString()} cr</span></p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                    <button onClick={() => openModal('add_credits', member)} className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"><Plus size={12}/> Add Cr</button>
                    <button onClick={() => openModal('remove_credits', member)} className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1"><Minus size={12}/> Rem Cr</button>
                    <button onClick={() => openModal('set_credits', member)} className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1"><Edit2 size={12}/> Set Cr</button>
                    {member.subscription_status !== 'cancelled' && <button onClick={() => openModal('cancel_sub', member)} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 ml-auto"><Ban size={12}/> Cancel Sub</button>}
                  </div>
                </motion.div>
              ))}

              {/* PLANS */}
              {activeTab === 'plans' && plans.map(plan => (
                <motion.div key={plan.id} className="mb-3 rounded-2xl border border-white/5 glass p-5 flex justify-between items-center">
                  <div>
                    <p className="text-white font-bold text-lg">{plan.display_name} <span className="text-slate-500 font-normal text-sm">({plan.id})</span></p>
                    <p className="text-slate-400 text-sm mt-1">Rs {plan.price_pkr} · {plan.monthly_credits} Credits · {plan.is_popular ? 'Popular' : ''} {plan.public_visible ? '' : '(Hidden)'}</p>
                  </div>
                  <button onClick={() => openModal('plan_edit', plan)} className="btn-ghost text-sm px-4 py-2 flex items-center gap-2"><Edit2 size={14}/> Edit</button>
                </motion.div>
              ))}

              {/* COUPONS */}
              {activeTab === 'coupons' && coupons.map(c => (
                <motion.div key={c.id} className="mb-3 rounded-2xl border border-white/5 glass p-5 flex justify-between items-center">
                  <div>
                    <p className="text-white font-bold text-lg flex items-center gap-2">{c.code} {!c.active && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded">Disabled</span>}</p>
                    <p className="text-slate-400 text-sm mt-1">{c.discount_value}{c.discount_type === 'percent' ? '%' : ' PKR'} off · Applies to: {c.applies_to_plan || 'All'} · Used: {c.redemption_count}/{c.max_redemptions || '∞'}</p>
                  </div>
                  <button onClick={() => openModal('coupon_upsert', c)} className="btn-ghost text-sm px-4 py-2 flex items-center gap-2"><Edit2 size={14}/> Edit</button>
                </motion.div>
              ))}

              {/* ACCOUNTS */}
              {activeTab === 'accounts' && accounts.map(a => (
                <motion.div key={a.id} className="mb-3 rounded-2xl border border-white/5 glass p-5 flex justify-between items-center">
                  <div>
                    <p className="text-white font-bold text-lg flex items-center gap-2">{a.account_title} <span className="bg-white/10 text-slate-300 text-xs px-2 py-0.5 rounded">{a.method}</span> {!a.active && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded">Disabled</span>}</p>
                    <p className="text-slate-400 text-sm mt-1">{a.account_number} {a.bank_name && `· ${a.bank_name}`}</p>
                  </div>
                  <button onClick={() => openModal('account_upsert', a)} className="btn-ghost text-sm px-4 py-2 flex items-center gap-2"><Edit2 size={14}/> Edit</button>
                </motion.div>
              ))}

            </div>
          )}
        </Container>
      </Section>

      {/* Dynamic Modal */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !modalProcessing && setModalType(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              
              <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider text-sm">{modalType.replace('_', ' ')}</h3>
              
              {modalError && <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{modalError}</div>}

              {/* Members Action Inputs */}
              {(modalType === 'add_credits' || modalType === 'remove_credits' || modalType === 'set_credits') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Amount</label>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.amount || ''} onChange={e => setModalData({ ...modalData, amount: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Reason (Optional)</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.reason || ''} onChange={e => setModalData({ ...modalData, reason: e.target.value })} />
                  </div>
                </div>
              )}

              {modalType === 'cancel_sub' && (
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <input type="checkbox" checked={modalData.check} onChange={e => setModalData({ ...modalData, check: e.target.checked })} className="w-4 h-4" />
                    <span className="text-white text-sm">Also zero out credits (balance & monthly)</span>
                  </label>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Reason (Optional)</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.reason || ''} onChange={e => setModalData({ ...modalData, reason: e.target.value })} />
                  </div>
                </div>
              )}

              {/* Plan Edit Inputs */}
              {modalType === 'plan_edit' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Price (PKR)</label>
                      <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.price_pkr || 0} onChange={e => setModalData({ ...modalData, price_pkr: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Monthly Credits</label>
                      <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.monthly_credits || 0} onChange={e => setModalData({ ...modalData, monthly_credits: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Display Name</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.display_name || ''} onChange={e => setModalData({ ...modalData, display_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Short Description</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.short_description || ''} onChange={e => setModalData({ ...modalData, short_description: e.target.value })} />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer"><input type="checkbox" checked={modalData.is_popular} onChange={e => setModalData({ ...modalData, is_popular: e.target.checked })} /> Popular Badge</label>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer"><input type="checkbox" checked={modalData.public_visible} onChange={e => setModalData({ ...modalData, public_visible: e.target.checked })} /> Public Visible</label>
                  </div>
                </div>
              )}

              {/* Coupon Upsert Inputs */}
              {modalType === 'coupon_upsert' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Code</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white uppercase" value={modalData.code || ''} onChange={e => setModalData({ ...modalData, code: e.target.value.toUpperCase() })} />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.description || ''} onChange={e => setModalData({ ...modalData, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Type</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.discount_type || 'percent'} onChange={e => setModalData({ ...modalData, discount_type: e.target.value })}>
                        <option value="percent">Percent (%)</option>
                        <option value="fixed">Fixed Amount (PKR)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Value</label>
                      <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.discount_value || 0} onChange={e => setModalData({ ...modalData, discount_value: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Applies To</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.applies_to_plan || 'all'} onChange={e => setModalData({ ...modalData, applies_to_plan: e.target.value })}>
                        <option value="all">All Plans</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="agency">Agency</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Max Redemptions (0 = ∞)</label>
                      <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.max_redemptions || 0} onChange={e => setModalData({ ...modalData, max_redemptions: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer"><input type="checkbox" checked={modalData.active} onChange={e => setModalData({ ...modalData, active: e.target.checked })} /> Active</label>
                  </div>
                </div>
              )}

              {/* Account Upsert Inputs */}
              {modalType === 'account_upsert' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Method</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.method || 'Bank Transfer'} onChange={e => setModalData({ ...modalData, method: e.target.value })}>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Sort Order</label>
                      <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.sort_order || 0} onChange={e => setModalData({ ...modalData, sort_order: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Account Title</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.account_title || ''} onChange={e => setModalData({ ...modalData, account_title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Account Number</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.account_number || ''} onChange={e => setModalData({ ...modalData, account_number: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Bank Name</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.bank_name || ''} onChange={e => setModalData({ ...modalData, bank_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">IBAN</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" value={modalData.iban || ''} onChange={e => setModalData({ ...modalData, iban: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Instructions (Optional)</label>
                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" rows={2} value={modalData.instructions || ''} onChange={e => setModalData({ ...modalData, instructions: e.target.value })} />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer"><input type="checkbox" checked={modalData.active} onChange={e => setModalData({ ...modalData, active: e.target.checked })} /> Active</label>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end mt-8">
                <button onClick={() => setModalType(null)} disabled={modalProcessing} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleModalSubmit} disabled={modalProcessing} className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-all disabled:opacity-50">{modalProcessing ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
