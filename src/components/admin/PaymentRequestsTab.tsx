import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, RefreshCw, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import type { PaymentRequest } from './adminTypes'
import StatusBadge from './StatusBadge'
import AdminModal from './AdminModal'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  requests: PaymentRequest[]
  loading: boolean
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected'
  onStatusFilterChange: (f: 'all' | 'pending' | 'approved' | 'rejected') => void
  onApprove: (req: PaymentRequest) => Promise<void>
  onReject: (req: PaymentRequest) => Promise<void>
  processingId: string | null
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function planLabel(plan: string) {
  const labels: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' }
  return labels[plan] ?? plan
}

const planColors: Record<string, string> = {
  free:    'bg-slate-100 text-slate-500 border-slate-200',
  starter: 'bg-blue-50 text-blue-700 border-blue-200',
  pro:     'bg-violet-50 text-violet-700 border-violet-200',
  agency:  'bg-indigo-50 text-indigo-700 border-indigo-200',
}

export default function PaymentRequestsTab({ requests, loading, statusFilter, onStatusFilterChange, onApprove, onReject, processingId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ req: PaymentRequest; type: 'approve' | 'reject' } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  // States for viewing proof securely
  const [proofLoading, setProofLoading] = useState<string | null>(null)
  const [proofError, setProofError] = useState<{ id: string, message: string } | null>(null)

  const handleViewProof = async (req: PaymentRequest) => {
    if (!req.payment_proof_path || !supabase) return
    
    setProofError(null)
    setProofLoading(req.id)
    
    try {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(req.payment_proof_path, 60) // 60 seconds
        
      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (err: any) {
      setProofError({ id: req.id, message: err.message || 'Failed to open proof' })
    } finally {
      setProofLoading(null)
    }
  }

  const handleConfirm = async () => {
    if (!confirmModal) return
    setActionLoading(true)
    try {
      if (confirmModal.type === 'approve') await onApprove(confirmModal.req)
      else await onReject(confirmModal.req)
      setConfirmModal(null)
    } finally {
      setActionLoading(false)
    }
  }

  const filters: Array<'all' | 'pending' | 'approved' | 'rejected'> = ['all', 'pending', 'approved', 'rejected']

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => onStatusFilterChange(f)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all ${
              statusFilter === f
                ? 'bg-indigo-600 text-slate-900 border-indigo-600 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>Customer</span>
          <span>Plan</span>
          <span>Amount</span>
          <span>Method</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">No payment requests found.</div>
        ) : (
          requests.map(req => (
            <div key={req.id}>
              <div
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 border-b border-gray-50 hover:bg-slate-50/50 transition-colors items-center cursor-pointer ${req.status === 'pending' ? 'bg-amber-50/30' : ''}`}
                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
              >
                {/* Customer */}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{req.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{req.email}</p>
                </div>

                {/* Plan */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border w-fit ${planColors[req.requested_plan] ?? planColors.free}`}>
                  {planLabel(req.requested_plan)}
                </span>

                {/* Amount */}
                <div>
                  <p className="text-sm font-semibold text-slate-900">Rs {req.final_amount_pkr ?? req.amount_pkr}</p>
                  {req.discount_amount_pkr ? (
                    <p className="text-xs text-green-600">−Rs {req.discount_amount_pkr}</p>
                  ) : null}
                </div>

                {/* Method */}
                <p className="text-sm text-slate-500">{req.payment_method}</p>

                {/* Status */}
                <StatusBadge status={req.status} />

                {/* Expand toggle */}
                <div className="flex items-center gap-2 justify-end">
                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmModal({ req, type: 'approve' }) }}
                        disabled={!!processingId}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-all"
                      >
                        <CheckCircle2 size={13} />
                        Approve
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmModal({ req, type: 'reject' }) }}
                        disabled={!!processingId}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-all"
                      >
                        <XCircle size={13} />
                        Reject
                      </button>
                    </>
                  )}
                  <button className="text-slate-400 hover:text-slate-500 p-1">
                    {expandedId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {expandedId === req.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 py-5 bg-slate-50 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-medium">Transaction Ref</p>
                        <p className="font-mono text-slate-800 text-xs bg-white px-2 py-1 rounded border border-slate-200 truncate">{req.transaction_reference}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-medium">Base Amount</p>
                        <p className="text-slate-800 font-semibold">Rs {req.base_amount_pkr ?? req.amount_pkr}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-medium">Discount</p>
                        <p className="text-slate-800">
                          {req.discount_amount_pkr ? `Rs ${req.discount_amount_pkr}` : '—'}
                          {req.coupon_code && <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{req.coupon_code}</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-medium">Final Amount</p>
                        <p className="text-slate-800 font-bold text-base">Rs {req.final_amount_pkr ?? req.amount_pkr}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-medium">Date Submitted</p>
                        <p className="text-slate-700">{formatDate(req.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-medium">Reviewed At</p>
                        <p className="text-slate-700">{formatDate(req.reviewed_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-medium">User ID</p>
                        <p className="font-mono text-slate-500 text-xs">{req.user_id}</p>
                      </div>
                      {req.phone_number && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium">Phone</p>
                          <p className="text-slate-700">{req.phone_number}</p>
                        </div>
                      )}
                      {req.contact_email && req.contact_email !== req.email && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium">Contact Email</p>
                          <p className="text-slate-700 truncate">{req.contact_email}</p>
                        </div>
                      )}
                      {req.notes && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Notes</p>
                          <p className="text-slate-700 italic">"{req.notes}"</p>
                        </div>
                      )}
                      {req.payment_proof_path && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Payment Proof</p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewProof(req)}
                              disabled={proofLoading === req.id}
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-300 font-medium disabled:opacity-50"
                            >
                              {proofLoading === req.id ? (
                                <><Loader2 size={13} className="animate-spin" /> Preparing...</>
                              ) : (
                                <><ExternalLink size={13} /> View Proof</>
                              )}
                            </button>
                            {proofError?.id === req.id && (
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} /> {proofError.message}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Confirm modal */}
      <AdminModal
        open={!!confirmModal}
        title={confirmModal?.type === 'approve' ? 'Approve Payment Request' : 'Reject Payment Request'}
        description={
          confirmModal?.type === 'approve'
            ? `This will activate the ${planLabel(confirmModal?.req?.requested_plan ?? '')} plan for ${confirmModal?.req?.email}. This action cannot be undone.`
            : `This will reject the payment request from ${confirmModal?.req?.email}. They will need to submit a new request.`
        }
        onClose={() => !actionLoading && setConfirmModal(null)}
        onConfirm={handleConfirm}
        confirmLabel={confirmModal?.type === 'approve' ? 'Approve & Activate' : 'Reject Request'}
        confirmVariant={confirmModal?.type === 'approve' ? 'primary' : 'danger'}
        loading={actionLoading}
      />
    </div>
  )
}
