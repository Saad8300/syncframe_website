// src/pages/CheckoutPage.tsx
// Step 2 of 2: Dedicated Checkout
// Two-column layout on desktop (form left, summary right).
// Handles: customer details, coupon validation, payment method, transaction ID,
// payment proof upload, and final submission.

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Check, Shield, Info, Copy, CheckCircle2,
  X, Upload, Image, AlertCircle, Tag, RefreshCw, Loader2, Zap
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { PLANS } from '../lib/plans'
import type { Plan } from '../lib/plans'
import Container from '../components/layout/Container'

interface PaymentAccount {
  id: string
  method: string
  account_title: string
  account_number: string
  bank_name: string | null
  iban: string | null
  instructions: string | null
  active: boolean
}

interface CouponResult {
  valid: boolean
  discount_type?: 'percent' | 'fixed'
  discount_value?: number
  discount_amount?: number
  final_amount?: number
  description?: string
  error?: string
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

// Phone validation: Pakistan format loosely, can start with 0 or +92
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  // Accept: 03XXXXXXXXX (11 digits), +923XXXXXXXXX (13), 923XXXXXXXXX (12)
  return /^((\+92|92)?3\d{9}|0?3\d{9})$/.test(cleaned)
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
    >
      {copied ? <CheckCircle2 size={13} className="text-green-500" /> : <Copy size={13} />}
      {copied ? 'Copied!' : (label || 'Copy')}
    </button>
  )
}

function FieldLabel({ htmlFor, required, children }: { htmlFor?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-300 mb-2">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-xl text-sm font-medium text-white placeholder:text-slate-500 bg-surface-850 border ${
    hasError
      ? 'border-red-400 focus:border-red-500 ring-1 ring-red-400'
      : 'border-white/10 focus:border-indigo-400'
  } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all`

export default function CheckoutPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const planIdFromUrl = searchParams.get('plan') || ''

  // ── Plan resolution ──────────────────────────────────────────
  const [resolvedPlan, setResolvedPlan] = useState<Plan | null>(null)
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // ── Customer details ─────────────────────────────────────────
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // ── Payment method ───────────────────────────────────────────
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  // ── Coupon ───────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  // ── Transaction ID ───────────────────────────────────────────
  const [transactionRef, setTransactionRef] = useState('')

  // ── Payment proof ─────────────────────────────────────────────
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Notes ────────────────────────────────────────────────────
  const [notes, setNotes] = useState('')

  // ── Submission ───────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ planName: string; amount: number; requestId: string } | null>(null)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' }, replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Pre-fill customer details from auth
  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setFullName(user.name || '')
    }
  }, [user])

  // Load plan + payment accounts
  useEffect(() => {
    async function loadData() {
      // Resolve plan from URL + DB
      let plan: Plan | null = null

      if (supabase) {
        try {
          const { data } = await supabase
            .from('plans')
            .select('*')
            .eq('public_visible', true)
            .order('sort_order', { ascending: true })

          if (data && data.length > 0) {
            const paidPlans = PLANS.filter(p => p.id !== 'free')
            const merged = paidPlans
              .map(staticPlan => {
                const dbPlan = data.find((p: any) => p.id === staticPlan.id)
                if (dbPlan) {
                  return {
                    ...staticPlan,
                    display_name: dbPlan.display_name || staticPlan.display_name,
                    price_pkr: dbPlan.price_pkr,
                    price_label: dbPlan.price_pkr > 0 ? `Rs ${dbPlan.price_pkr.toLocaleString()}` : 'Free',
                    monthly_credits: dbPlan.monthly_credits,
                    credits_note: dbPlan.short_description || `${dbPlan.monthly_credits.toLocaleString()} credits / month`,
                  } as Plan
                }
                return null
              })
              .filter(Boolean) as Plan[]

            plan = merged.find(p => p.id === planIdFromUrl) || null
          }
        } catch {
          // fetch failed, handled by plan resolution check below
        }
      }

      if (!plan) {
        // We do NOT fallback to static for the final purchase flow for safety.
        // The plan MUST be verified by the database to allow checkout.
        setResolvedPlan(null)
      } else {
        setResolvedPlan(plan)
      }

      // Load payment accounts
      if (supabase) {
        try {
          const { data: accts } = await supabase
            .from('payment_accounts')
            .select('*')
            .eq('active', true)
            .order('sort_order', { ascending: true })
          if (accts && accts.length > 0) {
            setAccounts(accts)
            setSelectedAccountId(accts[0].id)
          }
        } catch {
          // ignore
        }
      }

      setDataLoading(false)
    }

    if (!authLoading && isAuthenticated) {
      loadData()
    }
  }, [planIdFromUrl, authLoading, isAuthenticated])

  // ── Computed amounts ─────────────────────────────────────────
  const baseAmount = resolvedPlan?.price_pkr ?? 0
  const discountAmount = couponResult?.discount_amount ?? 0
  const finalAmount = couponResult?.final_amount ?? baseAmount

  // ── Coupon validation ─────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !resolvedPlan || !supabase) return
    setCouponLoading(true)
    setCouponResult(null)

    try {
      const { data, error } = await supabase.rpc('validate_coupon_preview', {
        p_coupon_code: couponInput.trim().toUpperCase(),
        p_plan_id: resolvedPlan.id
      })

      if (error) {
        setCouponResult({ valid: false, error: error.message })
      } else if (data) {
        setCouponResult({
          valid: true,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          discount_amount: data.discount_amount,
          final_amount: data.final_amount,
          description: data.description,
        })
        setAppliedCoupon(couponInput.trim().toUpperCase())
      } else {
        setCouponResult({ valid: false, error: 'Invalid or expired coupon.' })
      }
    } catch (err: any) {
      setCouponResult({ valid: false, error: err.message || 'Could not validate coupon.' })
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponResult(null)
    setCouponInput('')
  }

  // ── File upload ───────────────────────────────────────────────
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8 MB

  const handleFileSelect = useCallback((file: File) => {
    setUploadError(null)
    setUploadState('idle')
    setUploadedPath(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only JPG, PNG, or WEBP images are allowed.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File is too large. Maximum size is 8 MB.')
      return
    }

    setProofFile(file)
    const reader = new FileReader()
    reader.onload = e => setProofPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleRemoveFile = () => {
    setProofFile(null)
    setProofPreview(null)
    setUploadState('idle')
    setUploadedPath(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Upload to Supabase Storage
  const uploadProof = async (): Promise<string | null> => {
    if (!proofFile || !user || !supabase) return null
    setUploadState('uploading')

    try {
      const ext = proofFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const uniqueId = crypto.randomUUID()
      const safeName = `${user.id}/${uniqueId}.${ext}`

      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(safeName, proofFile, {
          contentType: proofFile.type,
          upsert: false,
        })

      if (error) throw error
      setUploadState('done')
      setUploadedPath(data.path)
      return data.path
    } catch (err: any) {
      setUploadState('error')
      setUploadError(err.message || 'Upload failed.')
      return null
    }
  }

  // ── Field validation ──────────────────────────────────────────
  const validateFields = (): boolean => {
    const errors: Record<string, string> = {}

    if (!fullName.trim()) errors.fullName = 'Full name is required.'
    else if (fullName.trim().length < 2) errors.fullName = 'Name must be at least 2 characters.'

    if (!email.trim()) errors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.'

    if (!phone.trim()) errors.phone = 'Phone number is required.'
    else if (!isValidPhone(phone)) errors.phone = 'Enter a valid Pakistani phone number (e.g. 03001234567).'

    if (!selectedAccountId) errors.account = 'Please select a payment method.'

    if (!transactionRef.trim()) errors.transactionRef = 'Transaction reference is required.'
    else if (transactionRef.trim().length < 4) errors.transactionRef = 'Transaction reference seems too short.'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Idempotency ──────────────────────────────────────────────
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id && resolvedPlan?.id) {
      const storageKey = `checkout_idemp:${user.id}:${resolvedPlan.id}`
      let key = sessionStorage.getItem(storageKey)
      if (!key) {
        key = crypto.randomUUID()
        sessionStorage.setItem(storageKey, key)
      }
      setIdempotencyKey(key)
    }
  }, [user?.id, resolvedPlan?.id])

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvedPlan || !supabase || !user || !idempotencyKey) return
    if (!validateFields()) return

    setSubmitError(null)
    setSubmitting(true)

    let proofPath: string | null = uploadedPath

    let rpcData: any = null

    try {
      // Upload proof if provided
      if (proofFile && !proofPath) {
        proofPath = await uploadProof()
        if (!proofPath && proofFile) {
          // Upload failed — stop
          setSubmitting(false)
          return
        }
      }

      const { data, error } = await supabase.rpc('submit_payment_request', {
        p_full_name: fullName.trim(),
        p_contact_email: email.trim(),
        p_phone_number: phone.trim(),
        p_requested_plan: resolvedPlan.id,
        p_payment_account_id: selectedAccountId,
        p_transaction_reference: transactionRef.trim(),
        p_notes: notes.trim() || null,
        p_coupon_code: appliedCoupon || null,
        p_payment_proof_path: proofPath || null,
        p_idempotency_key: idempotencyKey,
      })

      if (error) throw error
      rpcData = data
    } catch (err: any) {
      // PHASE A: RPC failed. Attempt cleanup of unused proof
      setSubmitError(err.message || 'Submission failed. Please try again.')

      if (proofPath) {
        try {
          const { error: cleanupError } = await supabase.storage.from('payment-proofs').remove([proofPath])
          if (cleanupError) {
             setSubmitError(`Submission failed (${err.message}). We also failed to clean up the uploaded proof screenshot. Please do not re-upload it when retrying.`)
          } else {
             setUploadedPath(null)
             setUploadState('idle')
          }
        } catch (cleanupEx: any) {
           setSubmitError(`Submission failed (${err.message}). We also failed to clean up the uploaded proof screenshot: ${cleanupEx.message}. Please do not re-upload it when retrying.`)
        }
      }
      setSubmitting(false)
      return
    }

    // PHASE B: RPC returned successfully, validate response
    if (
      !rpcData ||
      rpcData.success !== true ||
      typeof rpcData.final_amount !== 'number' ||
      typeof rpcData.base_amount !== 'number' ||
      typeof rpcData.discount !== 'number' ||
      !rpcData.request_id
    ) {
      setSubmitError('Your request may have been submitted, but confirmation could not be verified. Retry safely.')
      setSubmitting(false)
      return
    }

    const storageKey = `checkout_idemp:${user.id}:${resolvedPlan.id}`
    sessionStorage.removeItem(storageKey)

    setSuccess({
      planName: resolvedPlan.display_name,
      amount: rpcData.final_amount,
      requestId: rpcData.request_id,
    })
    setSubmitting(false)
  }

  // ── Success screen ────────────────────────────────────────────
  if (success) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-[72px] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="bg-[#0a0a0f] rounded-3xl border border-white/10 shadow-xl p-10 text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-green-500" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Request Submitted!
            </h1>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Your request for the <strong className="text-white">{success.planName}</strong> plan has been received. Our team will verify your payment and activate your plan.
            </p>

            <div className="bg-surface-850 rounded-2xl p-5 mb-8 text-left space-y-3 border border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Plan</span>
                <span className="font-semibold text-white">{success.planName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Amount Paid</span>
                <span className="font-semibold text-white">Rs {success.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Under Review
                </span>
              </div>
            </div>

            <div className="bg-indigo-500/10 rounded-2xl p-4 mb-8 text-left border border-indigo-500/20">
              <p className="text-sm text-indigo-300 leading-relaxed">
                <span className="font-semibold block mb-1">What happens next?</span>
                Our team typically reviews payment requests within a few hours during business hours. You'll be able to log in to the desktop app with the same account to access your plan once activated.
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full py-3.5 text-base"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (authLoading || dataLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-[72px]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
      </div>
    )
  }

  const selectedAccount = accounts.find(a => a.id === selectedAccountId)

  return (
    <div className="w-full min-h-screen pt-[72px] pb-16">
      <div className="py-8 md:py-12">
        <Container className="max-w-7xl">

          {!resolvedPlan && !dataLoading ? (
            <div className="text-center py-20 bg-surface-850 rounded-2xl border border-white/10 shadow-xl max-w-2xl mx-auto">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Checkout Unavailable</h2>
              <p className="text-slate-400 mb-6">We could not load the requested plan from our database. It may be unavailable or there is a network issue.</p>
              <button
                onClick={() => navigate('/upgrade')}
                className="btn-primary py-2.5 px-6 rounded-xl"
              >
                Go back to Plans
              </button>
            </div>
          ) : (
            <>
              {/* Header with back link and step indicator */}
              <div className="mb-8 flex items-center justify-between">
                {/* Step indicator */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check size={12} strokeWidth={3} className="text-white" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium hidden sm:inline">Plan Selected</span>
                  </div>
                  <div className="w-8 h-[2px] bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                      <span className="text-white text-[11px] font-bold">2</span>
                    </div>
                    <span className="text-sm font-semibold text-white">Checkout</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/upgrade?plan=${resolvedPlan?.id || ''}`)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={14} />
                  Change plan
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-10">

                  {/* ── LEFT: Main form (approx 65%) ──────────────────────────────────── */}
                  <div className="w-full lg:w-[65%] xl:w-[68%] space-y-6">

                    {/* Global submit error */}
                    {submitError && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{submitError}</p>
                      </div>
                    )}

                    {/* ── Section 1: Customer Details ─────────────────────── */}
                    <section className="bg-surface-850 rounded-2xl border border-white/5 p-5 sm:p-6">
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] flex items-center justify-center">1</span>
                        Customer Details
                      </h2>

                      <div className="space-y-4">
                        <div>
                          <FieldLabel htmlFor="fullName" required>Full Name</FieldLabel>
                          <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="e.g. Ahmed Khan"
                            className={inputCls(!!fieldErrors.fullName)}
                          />
                          {fieldErrors.fullName && (
                            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.fullName}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <FieldLabel htmlFor="email" required>Email Address</FieldLabel>
                            <input
                              id="email"
                              type="email"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              className={inputCls(!!fieldErrors.email)}
                            />
                            {fieldErrors.email && (
                              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.email}</p>
                            )}
                          </div>
                          <div>
                            <FieldLabel htmlFor="phone" required>Phone Number</FieldLabel>
                            <input
                              id="phone"
                              type="tel"
                              value={phone}
                              onChange={e => setPhone(e.target.value)}
                              placeholder="03001234567"
                              className={inputCls(!!fieldErrors.phone)}
                            />
                            {fieldErrors.phone && (
                              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.phone}</p>
                            )}
                            {!fieldErrors.phone && phone && isValidPhone(phone) && (
                              <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1"><CheckCircle2 size={12} />Valid number</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* ── Section 2: Payment Details ───────────────────────── */}
                    <section className="bg-surface-850 rounded-2xl border border-white/5 p-5 sm:p-6">
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] flex items-center justify-center">2</span>
                        Payment Details
                      </h2>

                      {accounts.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-sm">
                          No payment methods configured. Please contact support.
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {/* Payment Method Selector */}
                          <div>
                            <FieldLabel required>Select Payment Method</FieldLabel>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {accounts.map(acc => {
                                const isSelected = acc.id === selectedAccountId
                                return (
                                  <button
                                    key={acc.id}
                                    type="button"
                                    onClick={() => setSelectedAccountId(acc.id)}
                                    className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                                      isSelected
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-white/5 hover:border-white/10 bg-surface-900/50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'
                                      }`}>
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-surface-900" />}
                                      </div>
                                      <div>
                                        <p className={`text-sm font-semibold leading-none mb-1 ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>
                                          {acc.method}
                                        </p>
                                        <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                          {acc.account_title}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                            {fieldErrors.account && (
                              <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.account}</p>
                            )}
                          </div>

                          {/* Selected Account Transfer Details */}
                          <AnimatePresence mode="wait">
                            {selectedAccount && (
                              <motion.div
                                key={selectedAccount.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-5 border-t border-white/5">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Shield size={14} className="text-indigo-400" />
                                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Transfer Details</p>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-900/50 rounded-xl p-4 border border-white/5">
                                    {selectedAccount.bank_name && (
                                      <div className="col-span-2 sm:col-span-1">
                                        <p className="text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">Bank</p>
                                        <p className="text-sm font-medium text-slate-200">{selectedAccount.bank_name}</p>
                                      </div>
                                    )}
                                    <div className="col-span-2 sm:col-span-1">
                                      <p className="text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">Account Title</p>
                                      <p className="text-sm font-medium text-slate-200">{selectedAccount.account_title}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">Account Number</p>
                                      <div className="flex items-center gap-2">
                                        <p className="font-mono text-sm text-slate-200">{selectedAccount.account_number}</p>
                                        <CopyButton value={selectedAccount.account_number} label="" />
                                      </div>
                                    </div>
                                    {selectedAccount.iban && (
                                      <div className="col-span-full pt-2 border-t border-white/5">
                                        <p className="text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">IBAN</p>
                                        <div className="flex items-center gap-2">
                                          <p className="font-mono text-sm text-slate-200 break-all">{selectedAccount.iban}</p>
                                          <CopyButton value={selectedAccount.iban} label="" />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {selectedAccount.instructions && (
                                    <div className="mt-3 flex gap-2.5 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                      <Info size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                                      <p className="text-[11px] text-indigo-300 leading-relaxed">
                                        {selectedAccount.instructions}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </section>

                    {/* ── Section 3: Payment Confirmation ───────────────── */}
                    <section className="bg-surface-850 rounded-2xl border border-white/5 p-5 sm:p-6">
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] flex items-center justify-center">3</span>
                        Payment Confirmation
                      </h2>

                      <div className="space-y-6">
                        {/* Transaction Reference */}
                        <div>
                          <FieldLabel htmlFor="transactionRef" required>Transaction ID / Reference</FieldLabel>
                          <input
                            id="transactionRef"
                            type="text"
                            value={transactionRef}
                            onChange={e => setTransactionRef(e.target.value)}
                            placeholder="e.g. 0123456789 or TXN-XXXXXX"
                            className={inputCls(!!fieldErrors.transactionRef)}
                          />
                          {fieldErrors.transactionRef && (
                            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.transactionRef}</p>
                          )}
                        </div>

                        {/* Payment Screenshot */}
                        <div>
                          <FieldLabel>Payment Screenshot <span className="text-slate-500 font-normal">(Optional but recommended)</span></FieldLabel>
                          {proofPreview ? (
                            <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-white/10 h-36">
                              <img src={proofPreview} alt="Proof preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md backdrop-blur-sm"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div
                              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                              onDragLeave={() => setIsDragging(false)}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                              className={`relative flex flex-col items-center justify-center gap-2 h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                                isDragging
                                  ? 'border-indigo-400 bg-indigo-500/10'
                                  : 'border-white/10 hover:border-indigo-500/40 hover:bg-surface-900/50'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-full bg-surface-900 flex items-center justify-center">
                                <Upload size={18} className="text-slate-400" />
                              </div>
                              <div className="text-center">
                                <p className="text-[13px] font-medium text-slate-300">Click to browse or drag & drop</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, WEBP · Max 8 MB</p>
                              </div>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="hidden"
                                onChange={e => {
                                  const f = e.target.files?.[0]
                                  if (f) handleFileSelect(f)
                                }}
                              />
                            </div>
                          )}

                          {uploadError && uploadState !== 'error' && (
                            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{uploadError}</p>
                          )}
                          {uploadState === 'idle' && proofFile && !proofPreview && (
                            <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1.5">
                              <Image size={12} /> {proofFile.name}
                            </p>
                          )}
                        </div>

                        {/* Additional Notes (Expandable) */}
                        <div className="pt-2">
                          <details className="group">
                            <summary className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer list-none transition-colors">
                              <span className="w-4 h-4 flex items-center justify-center rounded bg-indigo-500/20 group-open:bg-indigo-500/10 transition-colors">+</span>
                              Add an optional note
                            </summary>
                            <div className="mt-3">
                              <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Any additional information regarding your payment…"
                                rows={2}
                                maxLength={500}
                                className={inputCls() + ' resize-none'}
                              />
                              <p className="text-right text-[10px] text-slate-500 mt-1">{notes.length}/500</p>
                            </div>
                          </details>
                        </div>
                      </div>
                    </section>

                  </div>

                  {/* ── RIGHT: Sticky Order Summary (approx 35%) ──────────────────────── */}
                  <div className="w-full lg:w-[35%] xl:w-[32%] flex-shrink-0">
                    <div className="lg:sticky lg:top-24 space-y-4">

                      {/* Summary Card */}
                      <div className="bg-surface-850 rounded-2xl border border-white/5 p-5 sm:p-6 shadow-xl shadow-black/20">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Order Summary</h3>

                        {resolvedPlan && (
                          <>
                            {/* Plan info */}
                            <div className="bg-surface-900/50 rounded-xl p-4 border border-white/5 mb-5">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <p className="text-sm font-bold text-white">{resolvedPlan.display_name}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{resolvedPlan.credits_note}</p>
                                </div>
                                <p className="text-sm font-bold text-white whitespace-nowrap">{resolvedPlan.price_label}<span className="text-[10px] text-slate-400 font-normal">/mo</span></p>
                              </div>

                              <ul className="space-y-1.5 mt-3">
                                {resolvedPlan.features.slice(0, 3).map((f, i) => (
                                  <li key={i} className="flex items-center gap-2 text-[11px] text-slate-400">
                                    <Check size={10} className="text-indigo-400 flex-shrink-0" strokeWidth={3} />
                                    {f}
                                  </li>
                                ))}
                                {resolvedPlan.features.length > 3 && (
                                  <li className="text-[10px] text-slate-500 pl-4">
                                    +{resolvedPlan.features.length - 3} more features
                                  </li>
                                )}
                              </ul>
                            </div>

                            {/* Coupon Inline Section */}
                            <div className="mb-5">
                              {appliedCoupon && couponResult?.valid ? (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                  <div className="flex items-center gap-2.5">
                                    <Tag size={14} className="text-green-400" />
                                    <div>
                                      <p className="text-xs font-bold text-green-400">{appliedCoupon}</p>
                                      {couponResult.description && (
                                        <p className="text-[10px] text-green-500">{couponResult.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleRemoveCoupon}
                                    className="p-1 rounded-full text-green-400 hover:bg-green-500/20 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={couponInput}
                                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                                      placeholder="Discount Code"
                                      className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide text-white placeholder:text-slate-500 bg-surface-900 border border-white/5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition-all uppercase ${
                                        couponResult?.valid === false ? 'border-red-400/50' : ''
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={handleApplyCoupon}
                                      disabled={couponLoading || !couponInput.trim()}
                                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/5"
                                    >
                                      {couponLoading ? <Loader2 size={13} className="animate-spin mx-auto" /> : 'Apply'}
                                    </button>
                                  </div>
                                  {couponResult?.valid === false && (
                                    <p className="mt-1.5 text-[10px] text-red-400 flex items-center gap-1">
                                      <AlertCircle size={10} />{couponResult.error || 'Invalid or expired coupon.'}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Price breakdown */}
                            <div className="space-y-3 pt-4 border-t border-white/5 mb-5">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Subtotal</span>
                                <span className="text-white font-medium">Rs {baseAmount.toLocaleString()}</span>
                              </div>

                              {discountAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-green-400 flex items-center gap-1">
                                    <Tag size={12} /> Coupon ({appliedCoupon})
                                  </span>
                                  <span className="text-green-400 font-medium">−Rs {discountAmount.toLocaleString()}</span>
                                </div>
                              )}

                              <div className="flex justify-between pt-3 border-t border-white/5">
                                <span className="font-bold text-white text-base">Total to Pay</span>
                                <span className="font-black text-xl text-indigo-400">Rs {finalAmount.toLocaleString()}</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Trust & Submit */}
                        <div className="space-y-4">
                          <div className="flex gap-2.5 bg-surface-900/50 rounded-xl p-3 border border-white/5">
                            <Shield size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[11px] font-semibold text-slate-300 mb-0.5">Manual Review</p>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                Payments are manually verified. Plans are usually activated within a few business hours.
                              </p>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={submitting || accounts.length === 0}
                            className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                          >
                            {submitting ? (
                              <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                            ) : (
                              <><Zap size={14} className="fill-current" /> Submit Payment</>
                            )}
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              </form>
            </>
          )}

        </Container>
      </div>
    </div>
  )
}
