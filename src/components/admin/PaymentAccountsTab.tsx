import { useState } from 'react'
import { Plus, Edit2, Check, X, Building2, Smartphone, CreditCard } from 'lucide-react'
import type { PaymentAccount } from './adminTypes'
import AdminModal, { FormField, inputCls, selectCls } from './AdminModal'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  accounts: PaymentAccount[]
  loading: boolean
  onRefresh: () => void
}

const methodIcons: Record<string, React.ReactNode> = {
  'Bank Transfer': <Building2 size={16} />,
  'JazzCash':      <Smartphone size={16} />,
  'EasyPaisa':     <Smartphone size={16} />,
  'Other':         <CreditCard size={16} />,
}

const defaultForm = (): Partial<PaymentAccount> => ({
  method: 'Bank Transfer',
  account_title: '',
  account_number: '',
  bank_name: '',
  iban: '',
  instructions: '',
  active: true,
  sort_order: 0,
})

export default function PaymentAccountsTab({ accounts, loading, onRefresh }: Props) {
  const [editing, setEditing] = useState<PaymentAccount | null>(null)
  const [form, setForm] = useState<Partial<PaymentAccount>>(defaultForm())
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm())
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (a: PaymentAccount) => {
    setEditing(a)
    setForm({ ...a })
    setError(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!supabase) return
    setError(null)
    if (!form.account_title?.trim()) { setError('Account title is required'); return }
    if (!form.account_number?.trim()) { setError('Account number is required'); return }
    setSaving(true)
    try {
      const { error } = await supabase.rpc('admin_upsert_payment_account', {
        p_id: editing?.id ?? null,
        p_method: form.method ?? 'Bank Transfer',
        p_account_title: form.account_title?.trim(),
        p_account_number: form.account_number?.trim(),
        p_bank_name: form.bank_name?.trim() || null,
        p_iban: form.iban?.trim() || null,
        p_instructions: form.instructions?.trim() || null,
        p_active: form.active ?? true,
        p_sort_order: Number(form.sort_order ?? 0),
      })
      if (error) throw error
      setModalOpen(false)
      onRefresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save account')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof PaymentAccount, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-slate-900 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Add Account
        </button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="py-20 text-center text-slate-500 text-sm bg-white border border-slate-100 rounded-2xl">
          No payment accounts configured. Add one so users can see payment options.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {accounts.map(a => (
            <div key={a.id} className={`bg-white border rounded-2xl p-5 shadow-none hover:shadow-md transition-all ${a.active ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-70'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.active ? 'bg-indigo-500/10 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                    {methodIcons[a.method] ?? <CreditCard size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{a.account_title}</p>
                    <span className="text-xs text-slate-500 font-medium">{a.method}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.active
                    ? <span className="flex items-center gap-1 text-xs text-green-600 font-semibold"><Check size={11}/> Active</span>
                    : <span className="flex items-center gap-1 text-xs text-red-500 font-semibold"><X size={11}/> Inactive</span>
                  }
                  <button
                    onClick={() => openEdit(a)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all"
                  >
                    <Edit2 size={11} /> Edit
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs font-medium">Account Number</span>
                  <span className="font-mono text-slate-800 text-xs">{a.account_number}</span>
                </div>
                {a.bank_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs font-medium">Bank</span>
                    <span className="text-slate-700 text-xs">{a.bank_name}</span>
                  </div>
                )}
                {a.iban && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs font-medium">IBAN</span>
                    <span className="font-mono text-slate-700 text-xs truncate max-w-[200px]">{a.iban}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs font-medium">Sort Order</span>
                  <span className="text-slate-700 text-xs">{a.sort_order}</span>
                </div>
              </div>
              {a.instructions && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 italic">"{a.instructions}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AdminModal
        open={modalOpen}
        title={editing ? 'Edit Payment Account' : 'Add Payment Account'}
        description={editing ? `Editing ${editing.account_title}` : 'Add a payment method for users to see on the Upgrade page'}
        onClose={() => !saving && setModalOpen(false)}
        onConfirm={handleSubmit}
        confirmLabel={editing ? 'Save Changes' : 'Add Account'}
        loading={saving}
        error={error}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Method">
              <select className={selectCls} value={form.method ?? 'Bank Transfer'} onChange={e => f('method', e.target.value)}>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Other">Other</option>
              </select>
            </FormField>
            <FormField label="Sort Order" hint="Lower = shown first">
              <input type="number" className={inputCls} min="0" value={form.sort_order ?? 0} onChange={e => f('sort_order', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Account Title *">
            <input type="text" className={inputCls} value={form.account_title ?? ''} onChange={e => f('account_title', e.target.value)} placeholder="e.g. SyncFrame Payments" />
          </FormField>
          <FormField label="Account Number *">
            <input type="text" className={inputCls} value={form.account_number ?? ''} onChange={e => f('account_number', e.target.value)} placeholder="Account / phone number" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Bank Name">
              <input type="text" className={inputCls} value={form.bank_name ?? ''} onChange={e => f('bank_name', e.target.value)} placeholder="e.g. HBL" />
            </FormField>
            <FormField label="IBAN">
              <input type="text" className={inputCls} value={form.iban ?? ''} onChange={e => f('iban', e.target.value)} placeholder="PK00 XXXX …" />
            </FormField>
          </div>
          <FormField label="Instructions" hint="Shown to users when they select this payment method">
            <textarea
              className={inputCls + ' resize-none'}
              rows={2}
              value={form.instructions ?? ''}
              onChange={e => f('instructions', e.target.value)}
              placeholder="Any transfer instructions for the user"
            />
          </FormField>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-200 transition-colors">
            <input type="checkbox" checked={form.active ?? true} onChange={e => f('active', e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Active (visible to users on Upgrade page)</span>
          </label>
        </div>
      </AdminModal>
    </div>
  )
}
