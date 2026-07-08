import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Zap, Coins, Calendar, BarChart3, Download, LogOut,
  RefreshCw, AlertCircle, Apple, Monitor, ArrowUpRight,
  Clock, CheckCircle2, XCircle, ChevronRight, User
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { getPlanById, formatToolName, normalizePlanId } from '../lib/plans'
import Container from '../components/layout/Container'

interface BillingData {
  plan_id: string
  status: string
  current_period_end?: string
}

interface CreditsData {
  balance: number
  monthly_allocation: number
  lifetime_used: number
  next_reset_at?: string
}

interface UsageJob {
  id: string
  tool_name: string
  credits_used?: number
  cost?: number
  status: string
  created_at: string
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function CreditBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  const remaining = Math.max(0, total - used)
  const color = pct > 80 ? 'from-red-500 to-orange-500' : pct > 60 ? 'from-amber-500 to-yellow-500' : 'from-indigo-500 to-violet-500'
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>{remaining.toLocaleString()} remaining</span>
        <span>{total.toLocaleString()} total</span>
      </div>
      <div className="w-full bg-surface-850 rounded-full h-2.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1.5">{pct}% used this period</p>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'success' || status === 'completed') return <CheckCircle2 size={14} className="text-emerald-400" />
  if (status === 'failed') return <XCircle size={14} className="text-red-400" />
  return <Clock size={14} className="text-amber-400" />
}

export default function DashboardPage() {
  const { user, signOut, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [billing, setBilling] = useState<BillingData | null>(null)
  const [credits, setCredits] = useState<CreditsData | null>(null)
  const [recentJobs, setRecentJobs] = useState<UsageJob[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/dashboard' }, replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  const loadData = useCallback(async (manual = false) => {
    if (!user || !supabase) return
    if (manual) setRefreshing(true)
    else setDataLoading(true)
    setDataError(null)

    try {
      const [subRes, credRes, jobsRes] = await Promise.all([
        supabase.from('subscriptions').select('plan_id, status, current_period_end').eq('user_id', user.id).maybeSingle(),
        supabase.from('credit_balances').select('balance, monthly_allocation, lifetime_used, next_reset_at').eq('user_id', user.id).maybeSingle(),
        supabase.from('usage_jobs').select('id, tool_name, credits_used, cost, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ])

      if (subRes.error && subRes.error.code !== 'PGRST116') throw subRes.error
      if (credRes.error && credRes.error.code !== 'PGRST116') throw credRes.error

      setBilling(subRes.data ?? { plan_id: 'free', status: 'active' })
      setCredits(credRes.data ?? { balance: 30, monthly_allocation: 30, lifetime_used: 0 })
      setRecentJobs(jobsRes.data ?? [])
    } catch (err: any) {
      setDataError(err.message || 'Failed to load account data.')
    } finally {
      setDataLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
      </div>
    )
  }

  const planId = normalizePlanId(billing?.plan_id || 'free')
  const plan = getPlanById(planId)
  const remaining = credits?.balance ?? 0
  const allocation = credits?.monthly_allocation ?? plan.monthly_credits
  const lifetimeUsed = credits?.lifetime_used ?? 0
  const renewalDate = credits?.next_reset_at || billing?.current_period_end
  const isFree = planId === 'free'

  const winUrl = import.meta.env.VITE_WINDOWS_DOWNLOAD_URL
  const macUrl = import.meta.env.VITE_MAC_DOWNLOAD_URL

  const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="w-full min-h-screen py-24 px-4">
      <Container className="max-w-6xl">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
              {initials}
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">Dashboard</h1>
              <p className="text-slate-400 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="btn-ghost text-sm py-2 px-4 flex items-center gap-2"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button onClick={handleSignOut} className="btn-ghost text-sm py-2 px-4 flex items-center gap-2 text-red-400 hover:text-red-300">
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Data error */}
        {dataError && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{dataError}</p>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Plan + Credits + Renewal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Plan Card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className={`p-6 rounded-2xl border ${planId === 'agency' ? 'bg-indigo-500/5 border-indigo-500/20' : 'glass border-white/8'}`}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={16} className="text-indigo-400" />
                    <span className="text-slate-400 text-sm font-medium">Current Plan</span>
                  </div>
                  {dataLoading ? (
                    <div className="h-8 w-28 bg-surface-850 rounded-lg animate-pulse" />
                  ) : (
                    <h2 className="text-2xl font-black text-white">{plan.display_name}</h2>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  billing?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-white/5'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${billing?.status === 'active' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  {billing?.status || 'Active'}
                </span>
              </div>

              {plan.price_pkr && (
                <p className="text-slate-400 text-sm mb-5">
                  <span className="text-white font-semibold">{plan.price_label}</span>
                  <span className="text-slate-500"> / month</span>
                </p>
              )}

              {isFree ? (
                <Link to="/upgrade" className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2">
                  <ArrowUpRight size={15} />
                  Upgrade Plan
                </Link>
              ) : (
                <Link to="/upgrade" className="btn-secondary text-sm py-2.5 px-5 inline-flex items-center gap-2">
                  Manage Subscription
                </Link>
              )}
            </motion.div>

            {/* Credits Card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl glass border border-white/8">
              <div className="flex items-center gap-2 mb-5">
                <Coins size={16} className="text-amber-400" />
                <span className="text-slate-400 text-sm font-medium">Credits</span>
              </div>

              {dataLoading ? (
                <div className="space-y-4">
                  <div className="h-10 w-32 bg-surface-850 rounded-lg animate-pulse" />
                  <div className="h-2.5 w-full bg-surface-850 rounded-full animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-4xl font-black text-white">{remaining.toLocaleString()}</span>
                    <span className="text-slate-400 text-sm pb-1">/ {allocation.toLocaleString()} credits</span>
                  </div>
                  <CreditBar used={allocation - remaining} total={allocation} />

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="glass rounded-xl p-4">
                      <p className="text-slate-500 text-xs mb-1">Lifetime Used</p>
                      <p className="text-white font-semibold text-lg">{lifetimeUsed.toLocaleString()}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar size={11} className="text-slate-500" />
                        <p className="text-slate-500 text-xs">{isFree ? 'Trial Status' : 'Credits Renew'}</p>
                      </div>
                      {isFree ? (
                        <p className="text-amber-400 font-semibold text-sm">Trial — no renewal</p>
                      ) : (
                        <p className="text-white font-semibold text-sm">{formatDate(renewalDate)}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>

            {/* Recent Usage */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="p-6 rounded-2xl glass border border-white/8">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={16} className="text-violet-400" />
                <span className="text-slate-400 text-sm font-medium">Recent Usage</span>
              </div>

              {dataLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No usage yet.</p>
                  <p className="text-slate-600 text-xs mt-1">Download the desktop app to start creating.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentJobs.map(job => (
                    <div key={job.id} className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-white/3 transition-colors">
                      <StatusIcon status={job.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{formatToolName(job.tool_name)}</p>
                        <p className="text-slate-500 text-xs">{formatDate(job.created_at)}</p>
                      </div>
                      <span className="text-slate-300 text-sm font-mono flex-shrink-0">
                        {(job.credits_used ?? job.cost ?? 0).toLocaleString()} cr
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl glass border border-white/8">
              <div className="flex items-center gap-2 mb-5">
                <User size={16} className="text-slate-400" />
                <span className="text-slate-400 text-sm font-medium">Account</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Email</p>
                  <p className="text-white text-sm font-medium truncate">{user?.email}</p>
                </div>
                {user?.name && (
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Name</p>
                    <p className="text-white text-sm font-medium">{user.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Plan</p>
                  <p className="text-white text-sm font-medium">{plan.display_name}</p>
                </div>
              </div>
            </motion.div>

            {/* Upgrade CTA */}
            {isFree && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-600/10 border border-indigo-500/20">
                <Zap size={20} className="text-indigo-400 mb-3" />
                <h3 className="text-white font-bold text-base mb-2">Unlock more credits</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Starter plan starts at Rs 499/month with 1,500 monthly credits.
                </p>
                <Link to="/upgrade" className="btn-primary text-sm py-3 px-5 w-full justify-center">
                  View Plans <ArrowUpRight size={14} />
                </Link>
              </motion.div>
            )}

            {/* Download App */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl glass border border-white/8">
              <div className="flex items-center gap-2 mb-1">
                <Download size={16} className="text-slate-400" />
                <span className="text-white font-semibold text-sm">Desktop App</span>
              </div>
              <p className="text-slate-500 text-xs mb-4">v0.1.1-stable · Mac & Windows</p>

              <div className="space-y-2">
                {macUrl ? (
                  <a href={macUrl} className="btn-secondary text-sm py-2.5 px-4 w-full justify-center flex items-center gap-2">
                    <Apple size={14} /> Download for Mac
                  </a>
                ) : (
                  <div className="text-center py-2.5 px-4 rounded-xl border border-white/5 text-slate-500 text-sm flex items-center justify-center gap-2">
                    <Apple size={14} /> Mac — Contact support
                  </div>
                )}
                {winUrl ? (
                  <a href={winUrl} className="btn-secondary text-sm py-2.5 px-4 w-full justify-center flex items-center gap-2">
                    <Monitor size={14} /> Download for Windows
                  </a>
                ) : (
                  <div className="text-center py-2.5 px-4 rounded-xl border border-white/5 text-slate-500 text-sm flex items-center justify-center gap-2">
                    <Monitor size={14} /> Windows — Contact support
                  </div>
                )}
              </div>

              <Link to="/download" className="flex items-center justify-center gap-1 mt-3 text-indigo-400 hover:text-indigo-300 text-xs transition-colors">
                View install guide <ChevronRight size={12} />
              </Link>
            </motion.div>

            {/* Links */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="flex flex-col gap-2">
              <Link to="/pricing" className="flex items-center justify-between px-4 py-3 rounded-xl glass border border-white/5 hover:border-white/10 transition-all group">
                <span className="text-slate-300 text-sm">View Plans</span>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
              <Link to="/download" className="flex items-center justify-between px-4 py-3 rounded-xl glass border border-white/5 hover:border-white/10 transition-all group">
                <span className="text-slate-300 text-sm">Download Page</span>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
              <Link to="/contact" className="flex items-center justify-between px-4 py-3 rounded-xl glass border border-white/5 hover:border-white/10 transition-all group">
                <span className="text-slate-300 text-sm">Contact Support</span>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            </motion.div>
          </div>
        </div>
      </Container>
    </div>
  )
}
