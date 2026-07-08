import { useState, useEffect, useCallback } from 'react'
import { Shield, Zap, Menu, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'

// Tab components
import AdminSidebar, { TabId } from '../components/admin/AdminSidebar'
import AdminHeader from '../components/admin/AdminHeader'
import SyncFrameLogo from '../components/SyncFrameLogo'
import OverviewTab from '../components/admin/OverviewTab'
import PaymentRequestsTab from '../components/admin/PaymentRequestsTab'
import MembersTab from '../components/admin/MembersTab'
import CouponsTab from '../components/admin/CouponsTab'
import PlanPricingTab from '../components/admin/PlanPricingTab'
import PaymentAccountsTab from '../components/admin/PaymentAccountsTab'
import AppReleasesTab from '../components/admin/AppReleasesTab'
import ChangelogTab from '../components/admin/ChangelogTab'

// Types
import type {
  PaymentRequest,
  Member,
  Plan,
  Coupon,
  PaymentAccount,
  AppRelease,
  ChangelogEntry
} from '../components/admin/adminTypes'

const TAB_META: Record<TabId, { title: string; description: string }> = {
  overview:  { title: 'Overview',          description: 'Quick stats and recent activity' },
  requests:  { title: 'Payment Requests',  description: 'Review and approve payment submissions' },
  members:   { title: 'Members',           description: 'Manage users, credits, and subscriptions' },
  coupons:   { title: 'Coupons',           description: 'Create and manage discount codes' },
  plans:     { title: 'Plan Pricing',      description: 'Adjust plan prices and credit allocations' },
  accounts:  { title: 'Payment Accounts',  description: 'Configure payment methods shown on Upgrade page' },
  releases:  { title: 'App Releases',      description: 'Manage desktop app versions and downloads' },
  changelog: { title: 'Changelog',         description: 'Publish release notes and product updates' },
}

export default function AdminPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [isAdmin, setIsAdmin]           = useState<boolean | null>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  const [activeTab, setActiveTab]       = useState<TabId>('overview')
  const [sidebarOpen, setSidebarOpen]   = useState(false)

  // Data state
  const [requests,  setRequests]  = useState<PaymentRequest[]>([])
  const [members,   setMembers]   = useState<Member[]>([])
  const [plans,     setPlans]     = useState<Plan[]>([])
  const [coupons,   setCoupons]   = useState<Coupon[]>([])
  const [accounts,  setAccounts]  = useState<PaymentAccount[]>([])
  const [releases,  setReleases]  = useState<AppRelease[]>([])
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([])

  const [dataLoading,   setDataLoading]  = useState(true)
  const [refreshing,    setRefreshing]   = useState(false)
  const [dataError,     setDataError]    = useState<string | null>(null)
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null)
  const [processingId,  setProcessingId] = useState<string | null>(null)

  // Filters for requests
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  // Filters for members
  const [memberSearch,       setMemberSearch]       = useState('')
  const [memberPlanFilter,   setMemberPlanFilter]   = useState('')
  const [memberStatusFilter, setMemberStatusFilter] = useState('')

  // ── Auth check ──────────────────────────────────────────────
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

  // ── Data loading ─────────────────────────────────────────────
  const loadData = useCallback(async (manual = false) => {
    if (!isAdmin || !supabase) return
    if (manual) setRefreshing(true)
    else setDataLoading(true)
    setDataError(null)

    try {
      // Always keep requests + members loaded for overview stats
      const fetchAll = activeTab === 'overview'

      const tasks: Promise<void>[] = []

      if (fetchAll || activeTab === 'requests') {
        tasks.push(
          (async () => {
            let q = supabase!.from('payment_requests').select('*').order('created_at', { ascending: false })
            if (activeTab === 'requests' && statusFilter !== 'all') q = q.eq('status', statusFilter)
            const { data, error } = await q
            if (error) throw error
            setRequests(data ?? [])
          })()
        )
      }

      if (fetchAll || activeTab === 'members') {
        tasks.push(
          (async () => {
            const { data, error } = await supabase!.rpc('admin_list_members', {
              p_search: memberSearch || null,
              p_plan: memberPlanFilter || null,
              p_status: memberStatusFilter || null,
            })
            if (error) throw error
            setMembers(data || [])
          })()
        )
      }

      if (activeTab === 'plans') {
        tasks.push(
          (async () => {
            const { data, error } = await supabase!.from('plans').select('*').order('sort_order', { ascending: true })
            if (error) throw error
            setPlans(data || [])
          })()
        )
      }

      if (activeTab === 'coupons') {
        tasks.push(
          (async () => {
            const { data, error } = await supabase!.rpc('admin_list_coupons')
            if (error) throw error
            setCoupons(data || [])
          })()
        )
      }

      if (activeTab === 'accounts') {
        tasks.push(
          (async () => {
            const { data, error } = await supabase!.rpc('admin_list_payment_accounts')
            if (error) throw error
            setAccounts(data || [])
          })()
        )
      }

      if (activeTab === 'releases') {
        tasks.push(
          (async () => {
            const { data, error } = await supabase!.rpc('admin_list_app_releases')
            if (error && error.code !== '42883') throw error // Ignore if RPC doesn't exist yet
            setReleases(data || [])
          })()
        )
      }

      if (activeTab === 'changelog') {
        tasks.push(
          (async () => {
            const { data, error } = await supabase!.rpc('admin_list_changelog_entries')
            if (error && error.code !== '42883') throw error
            setChangelogs(data || [])
          })()
        )
      }

      await Promise.all(tasks)
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

  // ── Payment actions ──────────────────────────────────────────
  const handleApprove = async (req: PaymentRequest) => {
    if (!supabase) return
    setProcessingId(req.id)
    try {
      const { error } = await supabase.rpc('approve_payment_request', { p_request_id: req.id })
      if (error) throw error
      showSuccess('Plan activated successfully.')
      loadData(true)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (req: PaymentRequest) => {
    if (!supabase) return
    setProcessingId(req.id)
    try {
      const { error } = await supabase.rpc('reject_payment_request', { p_request_id: req.id })
      if (error) throw error
      showSuccess('Request rejected.')
      loadData(true)
    } finally {
      setProcessingId(null)
    }
  }

  const showSuccess = (msg: string) => {
    setGlobalSuccess(msg)
    setTimeout(() => setGlobalSuccess(null), 4000)
  }

  // ── Loading / access states ───────────────────────────────────
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
          <p className="text-slate-500 text-sm">Verifying admin access…</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm mb-6">You do not have admin access to this panel.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-indigo-600 text-slate-900 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const meta = TAB_META[activeTab]

  return (
    // Force light theme on entire admin panel regardless of public site theme
    <div className="h-dvh overflow-hidden flex bg-slate-50 text-slate-800">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile until toggled */}
      <div className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false) }}
          pendingCount={pendingCount}
          adminEmail={user?.email ?? ''}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh bg-slate-50">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <SyncFrameLogo size="admin" subtitle="ADMIN CONSOLE" theme="light" linkTo={null} />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Global success toast */}
        {globalSuccess && (
          <div className="mx-6 mt-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium shadow-sm">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            {globalSuccess}
          </div>
        )}

        {/* Global error */}
        {dataError && (
          <div className="mx-6 mt-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm shadow-sm">
            <AlertTriangle size={16} className="flex-shrink-0" />
            {dataError}
          </div>
        )}

        {/* Page header */}
        <AdminHeader
          title={meta.title}
          description={meta.description}
          onRefresh={() => loadData(true)}
          refreshing={refreshing}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain px-6 lg:px-8 py-6">
          {activeTab === 'overview' && (
            <OverviewTab
              requests={requests}
              members={members}
              onNavigate={(tab) => setActiveTab(tab as TabId)}
            />
          )}

          {activeTab === 'requests' && (
            <PaymentRequestsTab
              requests={requests}
              loading={dataLoading}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onApprove={handleApprove}
              onReject={handleReject}
              processingId={processingId}
            />
          )}

          {activeTab === 'members' && (
            <MembersTab
              members={members}
              loading={dataLoading}
              search={memberSearch}
              planFilter={memberPlanFilter}
              statusFilter={memberStatusFilter}
              onSearchChange={setMemberSearch}
              onPlanFilterChange={setMemberPlanFilter}
              onStatusFilterChange={setMemberStatusFilter}
              onSearch={() => loadData(true)}
              onRefresh={() => loadData(true)}
            />
          )}

          {activeTab === 'coupons' && (
            <CouponsTab
              coupons={coupons}
              loading={dataLoading}
              onRefresh={() => loadData(true)}
            />
          )}

          {activeTab === 'plans' && (
            <PlanPricingTab
              plans={plans}
              loading={dataLoading}
              onRefresh={() => loadData(true)}
            />
          )}

          {activeTab === 'accounts' && (
            <PaymentAccountsTab
              accounts={accounts}
              loading={dataLoading}
              onRefresh={() => loadData(true)}
            />
          )}

          {activeTab === 'releases' && (
            <AppReleasesTab
              releases={releases}
              loading={dataLoading}
              onRefresh={() => loadData(true)}
            />
          )}

          {activeTab === 'changelog' && (
            <ChangelogTab
              changelogs={changelogs}
              loading={dataLoading}
              onRefresh={() => loadData(true)}
            />
          )}
        </main>
      </div>
    </div>
  )
}
