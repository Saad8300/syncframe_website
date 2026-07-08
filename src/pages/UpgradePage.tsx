// src/pages/UpgradePage.tsx
// Step 1 of 2: Plan Selection
// Redesigned premium plan selection page. Passes selected plan to /checkout via URL query param.

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, ChevronRight, Star } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { PLANS } from '../lib/plans'
import type { Plan as StaticPlan } from '../lib/plans'
import Container from '../components/layout/Container'

// Merged plan type from DB + static features
interface MergedPlan extends StaticPlan {
  is_popular: boolean
}

export default function UpgradePage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Determine initial plan from URL param, default to 'pro' (or first paid plan)
  const initialPlanId = searchParams.get('plan') || 'pro'

  const [mergedPlans, setMergedPlans] = useState<MergedPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId)
  const [loadingPlans, setLoadingPlans] = useState(true)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/upgrade' }, replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Load plans from DB (merged with static features)
  useEffect(() => {
    async function loadPlans() {
      // Start with static PLANS as fallback
      const paidStatic = PLANS.filter(p => p.id !== 'free')

      if (!supabase) {
        setMergedPlans([])
        setLoadingPlans(false)
        return
      }

      try {
        const { data } = await supabase
          .from('plans')
          .select('*')
          .eq('public_visible', true)
          .order('sort_order', { ascending: true })

        if (data && data.length > 0) {
          const merged: MergedPlan[] = paidStatic.map(staticPlan => {
            const dbPlan = data.find(p => p.id === staticPlan.id)
            if (dbPlan) {
              return {
                ...staticPlan,
                display_name: dbPlan.display_name || staticPlan.display_name,
                price_pkr: dbPlan.price_pkr,
                price_label: dbPlan.price_pkr > 0 ? `Rs ${dbPlan.price_pkr.toLocaleString()}` : 'Free',
                monthly_credits: dbPlan.monthly_credits,
                credits_note: dbPlan.short_description || `${dbPlan.monthly_credits.toLocaleString()} credits / month`,
                is_popular: dbPlan.is_popular,
                highlighted: dbPlan.is_popular,
              }
            }
            return null
          }).filter(Boolean) as MergedPlan[]
          setMergedPlans(merged)
        } else {
          setMergedPlans([])
        }
      } catch {
        setMergedPlans([])
      } finally {
        setLoadingPlans(false)
      }
    }
    loadPlans()
  }, [])

  // Validate selectedPlanId once plans are loaded
  useEffect(() => {
    if (mergedPlans.length > 0) {
      const validIds = mergedPlans.map(p => p.id)
      if (!validIds.includes(selectedPlanId)) {
        setSelectedPlanId(mergedPlans.find(p => p.is_popular)?.id || mergedPlans[0].id)
      }
    }
  }, [mergedPlans, selectedPlanId])

  const handleContinue = () => {
    if (!selectedPlanId) return
    navigate(`/checkout?plan=${selectedPlanId}`)
  }

  const selectedPlan = mergedPlans.find(p => p.id === selectedPlanId)

  if (authLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col min-h-screen pt-[72px]">
      <div className="flex-1 py-16 md:py-24">
        <Container className="max-w-6xl">

          {/* Header */}
          <div className="text-center mb-14">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <span className="text-sm font-semibold text-white">Choose Plan</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-surface-800 flex items-center justify-center">
                  <span className="text-slate-400 text-xs font-bold">2</span>
                </div>
                <span className="text-sm text-slate-400">Checkout</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Choose your plan
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Select the plan that best fits your workflow. All plans include local rendering — your files never leave your machine.
              </p>
              {user && (
                <p className="mt-3 text-sm text-slate-400">
                  Upgrading for{' '}
                  <span className="text-slate-200 font-medium">{user.email}</span>
                </p>
              )}
            </motion.div>
          </div>

          {/* Plan Cards */}
          {loadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 rounded-3xl bg-surface-850 animate-pulse" />
              ))}
            </div>
          ) : mergedPlans.length === 0 ? (
            <div className="text-center py-20 bg-surface-850 rounded-3xl border border-white/10 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-2">Pricing Unavailable</h2>
              <p className="text-slate-400">We could not load the plans from our database. Please check your network or contact support.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {mergedPlans.map((plan, i) => {
                const isSelected = plan.id === selectedPlanId
                const isPopular = plan.is_popular

                return (
                  <motion.button
                    key={plan.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative text-left rounded-3xl p-7 transition-all duration-300 border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isSelected
                        ? 'bg-indigo-500/[0.06] bg-indigo-500/10 border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.3),0_8px_32px_rgba(99,102,241,0.15)] shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_8px_32px_rgba(99,102,241,0.2)]'
                        : 'bg-surface-850 border-white/10 hover:border-white/20 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Popular badge */}
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] uppercase tracking-wider font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30">
                          <Star size={10} fill="white" />
                          Best Value
                        </span>
                      </div>
                    )}

                    {/* Selection indicator */}
                    <div className={`absolute top-6 right-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-white/20'
                    }`}>
                      {isSelected && <Check size={13} strokeWidth={3} className="text-white" />}
                    </div>

                    <div className={`mb-6 ${isPopular ? 'mt-4' : ''}`}>
                      {/* Plan name */}
                      <h3 className={`text-lg font-bold mb-1 ${
                        isSelected ? 'text-indigo-400' : 'text-white'
                      }`}>
                        {plan.display_name}
                      </h3>

                      {/* Credits note */}
                      <p className="text-slate-400 text-sm mb-5">
                        {plan.credits_note}
                      </p>

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white tracking-tight">
                          {plan.price_label}
                        </span>
                        <span className="text-slate-400 text-sm font-medium">/ month</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className={`h-px mb-6 ${isSelected ? 'bg-indigo-500/20' : 'bg-surface-850'}`} />

                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, fi) => (
                        <li key={fi} className="flex items-start gap-3 text-sm">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                            isSelected
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-surface-850 text-slate-400'
                          }`}>
                            <Check size={11} strokeWidth={3} />
                          </div>
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.button>
                )
              })}
            </motion.div>
          )}

          {/* Continue CTA */}
          {!loadingPlans && mergedPlans.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="mt-10 flex flex-col items-center gap-4"
            >
              <button
                onClick={handleContinue}
                disabled={!selectedPlanId}
                className="btn-primary py-4 px-10 text-base font-semibold rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed min-w-[280px] justify-center"
              >
                <span>
                  Continue to Checkout
                  {selectedPlan && (
                    <span className="ml-2 opacity-80 text-sm font-normal">
                      — {selectedPlan.display_name} ({selectedPlan.price_label}/mo)
                    </span>
                  )}
                </span>
                <ChevronRight size={18} />
              </button>

              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Zap size={12} className="text-indigo-400" />
                Manual review · Activated within a few hours · Cancel anytime
              </p>
            </motion.div>
          )}

          {/* Comparison hint */}
          {!loadingPlans && mergedPlans.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="mt-12 text-center"
            >
              <a
                href="/pricing"
                className="text-sm text-slate-400 hover:text-indigo-400 transition-colors underline underline-offset-2"
              >
                View full plan comparison →
              </a>
            </motion.div>
          )}

        </Container>
      </div>
    </div>
  )
}
