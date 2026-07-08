import { FileText, Users, CreditCard, TrendingUp, DollarSign, Activity, CheckCircle2, AlertCircle, Tag } from 'lucide-react'
import type { PaymentRequest, Member } from './adminTypes'
import { DonutChart, ProgressRing } from './AdminCharts'

interface Props {
  requests: PaymentRequest[]
  members: Member[]
  onNavigate: (tab: 'requests' | 'members' | 'coupons' | 'plans' | 'accounts') => void
}

export default function OverviewTab({ requests, members, onNavigate }: Props) {
  // --- Data Calculations ---
  
  // Status distributions
  const pending   = requests.filter(r => r.status === 'pending').length
  const approved  = requests.filter(r => r.status === 'approved').length
  const rejected  = requests.filter(r => r.status === 'rejected').length
  
  // Member stats
  const paidMembers = members.filter(m => m.plan_id !== 'free' && m.subscription_status === 'active').length
  const freeMembers = members.filter(m => m.plan_id === 'free').length
  
  const totalAllocated = members.reduce((sum, m) => sum + (m.monthly_allocation || 0), 0)
  const totalUsed = totalAllocated - members.reduce((sum, m) => sum + (m.balance || 0), 0)
  
  // Revenue calculations
  const getAmount = (req: PaymentRequest) => req.final_amount_pkr ?? req.amount_pkr ?? 0
  
  const approvedRequests = requests.filter(r => r.status === 'approved')
  const totalRevenue = approvedRequests.reduce((sum, r) => sum + getAmount(r), 0)
  
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const pendingRevenue = pendingRequests.reduce((sum, r) => sum + getAmount(r), 0)
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthRevenue = approvedRequests.filter(r => {
    const d = new Date(r.created_at)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).reduce((sum, r) => sum + getAmount(r), 0)
  
  const averageOrderValue = approvedRequests.length > 0 ? Math.round(totalRevenue / approvedRequests.length) : 0
  
  // Revenue by Plan
  const revenueByPlan = approvedRequests.reduce((acc, req) => {
    const plan = req.requested_plan || 'unknown'
    acc[plan] = (acc[plan] || 0) + getAmount(req)
    return acc
  }, {} as Record<string, number>)

  const planRevenueData = [
    { label: 'Starter', value: revenueByPlan['starter'] || 0, color: '#3b82f6' },
    { label: 'Pro', value: revenueByPlan['pro'] || 0, color: '#8b5cf6' },
    { label: 'Agency', value: revenueByPlan['agency'] || 0, color: '#6366f1' },
  ].filter(p => p.value > 0).sort((a, b) => b.value - a.value)

  const statusDistribution = [
    { label: 'Approved', value: approved, color: '#10b981' },
    { label: 'Pending', value: pending, color: '#f59e0b' },
    { label: 'Rejected', value: rejected, color: '#ef4444' },
  ].filter(p => p.value > 0)
  
  const planDistribution = [
    { label: 'Free', value: freeMembers, color: '#94a3b8' },
    { label: 'Starter', value: members.filter(m => m.plan_id === 'starter').length, color: '#3b82f6' },
    { label: 'Pro', value: members.filter(m => m.plan_id === 'pro').length, color: '#8b5cf6' },
    { label: 'Agency', value: members.filter(m => m.plan_id === 'agency').length, color: '#6366f1' },
  ].filter(p => p.value > 0).sort((a, b) => b.value - a.value)

  const recent = [...requests]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  const planColors: Record<string, string> = {
    free:    'bg-slate-100 text-slate-600 border border-slate-200/60',
    starter: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    pro:     'bg-violet-50 text-violet-700 border border-violet-200/60',
    agency:  'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
  }
  
  const statusColors: Record<string, string> = {
    pending:  'bg-amber-50 text-amber-700 border border-amber-200/60',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    rejected: 'bg-red-50 text-red-700 border border-red-200/60',
  }

  const formatCurrency = (num: number) => `Rs ${num.toLocaleString()}`

  return (
    <div className="space-y-8">
      {/* SECTION 1: Revenue Summary */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">Revenue Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(totalRevenue)}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{approved} approved payments</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">This Month</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(thisMonthRevenue)}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Revenue for current month</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Revenue</span>
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Activity size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(pendingRevenue)}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{pending} requests awaiting review</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Order Value</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(averageOrderValue)}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Per approved transaction</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Analytics Breakdowns */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">Business Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-none flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-900 mb-4 w-full text-left">Revenue by Plan</h3>
            <DonutChart data={planRevenueData} size={110} strokeWidth={12} totalLabel="Revenue" />
            <div className="w-full mt-5 space-y-2">
              {planRevenueData.length > 0 ? planRevenueData.map(p => (
                <div key={p.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.label}
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(p.value)}</span>
                </div>
              )) : (
                <div className="text-xs text-slate-500 text-center">No revenue data</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-none flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-900 mb-4 w-full text-left">Member Distribution</h3>
            <DonutChart data={planDistribution} size={110} strokeWidth={12} totalLabel="Members" />
            <div className="w-full mt-5 space-y-2">
              {planDistribution.map(p => (
                <div key={p.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.label}
                  </div>
                  <span className="font-bold text-slate-900">{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-none flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-900 mb-4 w-full text-left">Payment Status</h3>
            <DonutChart data={statusDistribution} size={110} strokeWidth={12} totalLabel="Requests" />
            <div className="w-full mt-5 space-y-2">
              {statusDistribution.map(p => (
                <div key={p.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.label}
                  </div>
                  <span className="font-bold text-slate-900">{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-none flex flex-col justify-center">
            <h3 className="text-sm font-bold text-slate-900 mb-4 w-full text-left">Credit Utilization</h3>
            <div className="flex justify-center mb-6 mt-2">
              <ProgressRing value={totalUsed} max={totalAllocated || 1} size={120} strokeWidth={12} color="#6366f1" />
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">
                <span className="font-bold text-slate-900">{totalUsed.toLocaleString()}</span> used out of {totalAllocated.toLocaleString()} allocated
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Payment Requests</h2>
          <button onClick={() => onNavigate('requests')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            View all requests →
          </button>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {recent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recent.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900">{req.full_name}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{req.email}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${planColors[req.requested_plan] ?? planColors.free}`}>
                          {req.requested_plan}
                        </span>
                        {req.coupon_code && (
                          <div className="text-xs text-indigo-500 mt-1 font-medium flex items-center gap-1">
                            <Tag size={10} /> {req.coupon_code}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900">{formatCurrency(getAmount(req))}</div>
                        {req.payment_method && <div className="text-slate-400 text-xs mt-0.5 capitalize">{req.payment_method}</div>}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs font-medium">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColors[req.status] ?? ''}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-16 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 mb-3">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No payment requests</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">There are currently no transactions on record.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
