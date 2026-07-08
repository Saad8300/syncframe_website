import { useState } from 'react'
import { Edit2, AlertTriangle, Zap } from 'lucide-react'
import type { Plan } from './adminTypes'
import AdminModal, { FormField, inputCls } from './AdminModal'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  plans: Plan[]
  loading: boolean
  onRefresh: () => void
}

const PLAN_ORDER = ['free', 'starter', 'pro', 'agency']

// Refined SaaS badge colors
const planColors: Record<string, { badge: string; icon: string }> = {
  free:    { badge: 'bg-slate-100 text-slate-600 border border-slate-200/60', icon: 'text-slate-500' },
  starter: { badge: 'bg-blue-50 text-blue-700 border border-blue-200/60',     icon: 'text-blue-500' },
  pro:     { badge: 'bg-violet-50 text-violet-700 border border-violet-200/60',icon: 'text-violet-500' },
  agency:  { badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',icon: 'text-indigo-500' },
}

export default function PlanPricingTab({ plans, loading, onRefresh }: Props) {
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState<Partial<Plan>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openEdit = (plan: Plan) => {
    setEditing(plan)
    setForm({ ...plan })
    setError(null)
  }

  const handleSubmit = async () => {
    if (!supabase || !editing) return
    setError(null)
    setSaving(true)
    try {
      const { error } = await supabase.rpc('admin_update_plan_settings', {
        p_plan_id: editing.id,
        p_price_pkr: Number(form.price_pkr),
        p_monthly_credits: Number(form.monthly_credits),
        p_display_name: form.display_name ?? editing.display_name,
        p_short_description: form.short_description ?? '',
        p_is_popular: form.is_popular ?? false,
        p_public_visible: form.public_visible ?? true,
      })
      if (error) throw error
      setEditing(null)
      onRefresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof Plan, v: any) => setForm(prev => ({ ...prev, [k]: v }))
  const sortedPlans = [...plans].sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id))

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-white border border-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {sortedPlans.map(plan => {
            const c = planColors[plan.id] ?? planColors.free
            return (
              <div 
                key={plan.id} 
                className="group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-none hover:shadow-md hover:border-slate-300 transition-all flex flex-col"
              >
                {/* Popular Badge Top Accent */}
                {plan.is_popular && (
                  <div className="absolute -top-[1px] left-5 right-5 h-[3px] bg-amber-400 rounded-b-md" />
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className={`${c.icon}`} fill="currentColor" />
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${c.badge}`}>
                      {plan.id}
                    </span>
                    {!plan.public_visible && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-200/60 px-2 py-0.5 rounded-full">
                        Hidden
                      </span>
                    )}
                  </div>
                  {plan.is_popular && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                      Popular
                    </span>
                  )}
                </div>
                
                <div className="mb-6 flex-1">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{plan.display_name}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed min-h-[36px]">
                    {plan.short_description || 'No description provided.'}
                  </p>
                </div>
                
                <div className="border-t border-slate-100 pt-4 mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900 tracking-tighter">
                      {plan.price_pkr > 0 ? `Rs ${plan.price_pkr.toLocaleString()}` : 'Free'}
                    </span>
                    {plan.price_pkr > 0 && <span className="text-xs font-medium text-slate-400">/mo</span>}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    {plan.monthly_credits.toLocaleString()} credits included
                  </div>
                </div>

                <button
                  onClick={() => openEdit(plan)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-slate-500 bg-white border border-slate-200 shadow-none hover:bg-slate-100 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                >
                  <Edit2 size={13} />
                  Edit Plan
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      <AdminModal
        open={!!editing}
        title={`Edit ${editing?.display_name ?? ''} Plan`}
        description="Changes to pricing and credits will apply to future approvals only."
        onClose={() => !saving && setEditing(null)}
        onConfirm={handleSubmit}
        confirmLabel="Save Changes"
        loading={saving}
        error={error}
        size="md"
      >
        <div className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-700 text-xs leading-relaxed">
              Changing monthly credits affects future approvals and resets. <strong>Existing user balances are not changed automatically.</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Display Name">
              <input type="text" className={inputCls} value={form.display_name ?? ''} onChange={e => f('display_name', e.target.value)} />
            </FormField>
            <FormField label="Plan ID" hint="Cannot be changed">
              <input type="text" className={inputCls + ' bg-slate-50 text-slate-500 cursor-not-allowed'} value={editing?.id ?? ''} disabled />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Price (PKR / month)">
              <input type="number" min="0" className={inputCls} value={form.price_pkr ?? 0} onChange={e => f('price_pkr', e.target.value)} />
            </FormField>
            <FormField label="Monthly Credits">
              <input type="number" min="0" className={inputCls} value={form.monthly_credits ?? 0} onChange={e => f('monthly_credits', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Short Description">
            <input type="text" className={inputCls} value={form.short_description ?? ''} onChange={e => f('short_description', e.target.value)} placeholder="Shown on pricing page" />
          </FormField>
          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_popular ?? false} onChange={e => f('is_popular', e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm text-slate-700 font-medium">Popular badge</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.public_visible ?? true} onChange={e => f('public_visible', e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm text-slate-700 font-medium">Publicly visible</span>
            </label>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
