import { useState } from 'react'
import { Plus, Edit2, Check, X } from 'lucide-react'
import type { Coupon } from './adminTypes'
import StatusBadge from './StatusBadge'
import AdminModal, { FormField, inputCls, selectCls } from './AdminModal'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  coupons: Coupon[]
  loading: boolean
  onRefresh: () => void
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type FormState = {
  code: string
  description: string
  discount_type: 'percent' | 'fixed'
  discount_value: string
  applies_to_plan: string
  active: boolean
  expires_at: string
  max_redemptions: string
}

const defaultForm = (): FormState => ({
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: '',
  applies_to_plan: 'all',
  active: true,
  expires_at: '',
  max_redemptions: '',
})

export default function CouponsTab({ coupons, loading, onRefresh }: Props) {
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm())
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (c: Coupon) => {
    setEditing(c)
    setForm({
      code: c.code,
      description: c.description || '',
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      applies_to_plan: c.applies_to_plan || 'all',
      active: c.active,
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
      max_redemptions: c.max_redemptions != null ? String(c.max_redemptions) : '',
    })
    setError(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!supabase) return
    setError(null)
    if (!form.code.trim()) { setError('Coupon code is required'); return }
    const dv = Number(form.discount_value)
    if (isNaN(dv) || dv <= 0) { setError('Discount value must be greater than 0'); return }
    setSaving(true)
    try {
      const { error } = await supabase.rpc('admin_upsert_coupon', {
        p_id: editing?.id ?? null,
        p_code: form.code.toUpperCase().trim(),
        p_description: form.description || null,
        p_discount_type: form.discount_type,
        p_discount_value: dv,
        p_applies_to_plan: form.applies_to_plan === 'all' ? null : form.applies_to_plan,
        p_active: form.active,
        p_expires_at: form.expires_at || null,
        p_max_redemptions: Number(form.max_redemptions) > 0 ? Number(form.max_redemptions) : null,
      })
      if (error) throw error
      setModalOpen(false)
      onRefresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-slate-900 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Create Coupon
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>Code</span>
          <span>Type</span>
          <span>Value</span>
          <span>Applies To</span>
          <span>Usage</span>
          <span>Expiry</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">No coupons found. Create one to get started.</div>
        ) : (
          coupons.map(c => (
            <div key={c.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-5 py-4 border-b border-gray-50 hover:bg-slate-50/50 transition-colors items-center">
              <div>
                <span className="font-mono font-bold text-sm text-slate-900">{c.code}</span>
                {c.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{c.description}</p>}
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border w-fit ${c.discount_type === 'percent' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {c.discount_type === 'percent' ? '%' : 'PKR'}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {c.discount_value}{c.discount_type === 'percent' ? '%' : ' Rs'}
              </span>
              <span className="text-xs text-slate-500">{c.applies_to_plan ? c.applies_to_plan.charAt(0).toUpperCase() + c.applies_to_plan.slice(1) : 'All'}</span>
              <div>
                <span className="text-sm text-slate-900">{c.redemption_count}</span>
                <span className="text-xs text-slate-400"> / {c.max_redemptions ?? '∞'}</span>
              </div>
              <span className="text-xs text-slate-500">{formatDate(c.expires_at)}</span>
              <div className="flex items-center gap-2 justify-end">
                {c.active
                  ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Check size={12}/> Active</span>
                  : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><X size={12}/> Off</span>
                }
                <button
                  onClick={() => openEdit(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium border border-slate-200 hover:bg-slate-200 transition-all"
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <AdminModal
        open={modalOpen}
        title={editing ? 'Edit Coupon' : 'Create Coupon'}
        description={editing ? `Editing ${editing.code}` : 'Create a new discount coupon'}
        onClose={() => !saving && setModalOpen(false)}
        onConfirm={handleSubmit}
        confirmLabel={editing ? 'Save Changes' : 'Create Coupon'}
        loading={saving}
        error={error}
        size="md"
      >
        <div className="space-y-4">
          <FormField label="Coupon Code *">
            <input
              type="text"
              className={inputCls + ' uppercase font-mono tracking-wider'}
              value={form.code}
              onChange={e => f('code', e.target.value.toUpperCase())}
              placeholder="e.g. LAUNCH20"
              disabled={!!editing}
            />
          </FormField>
          <FormField label="Description">
            <input
              type="text"
              className={inputCls}
              value={form.description}
              onChange={e => f('description', e.target.value)}
              placeholder="Optional internal note"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Discount Type">
              <select className={selectCls} value={form.discount_type} onChange={e => f('discount_type', e.target.value)}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs)</option>
              </select>
            </FormField>
            <FormField label="Discount Value *">
              <input
                type="number"
                className={inputCls}
                value={form.discount_value}
                onChange={e => f('discount_value', e.target.value)}
                placeholder={form.discount_type === 'percent' ? 'e.g. 20' : 'e.g. 100'}
                min="0"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Applies To Plan">
              <select className={selectCls} value={form.applies_to_plan} onChange={e => f('applies_to_plan', e.target.value)}>
                <option value="all">All Plans</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="agency">Agency</option>
              </select>
            </FormField>
            <FormField label="Max Redemptions" hint="Leave blank for unlimited">
              <input
                type="number"
                className={inputCls}
                value={form.max_redemptions}
                onChange={e => f('max_redemptions', e.target.value)}
                placeholder="∞ unlimited"
                min="0"
              />
            </FormField>
          </div>
          <FormField label="Expiry Date" hint="Leave blank for no expiry">
            <input
              type="date"
              className={inputCls}
              value={form.expires_at}
              onChange={e => f('expires_at', e.target.value)}
            />
          </FormField>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => f('active', e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm font-medium text-slate-700">Active (coupon can be used)</span>
          </label>
        </div>
      </AdminModal>
    </div>
  )
}
