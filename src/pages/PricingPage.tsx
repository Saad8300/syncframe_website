import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Info, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import CTASection from '../components/CTASection'
import Container from '../components/layout/Container'
import Section from '../components/layout/Section'
import { PLANS } from '../lib/plans'
import { supabase } from '../lib/supabaseClient'

const faqItems = [
  {
    q: 'What are credits?',
    a: 'Credits are consumed when you use SyncFrame tools in the desktop app. Each export, generation, or processing job costs credits based on video length and complexity. Credits refresh monthly on paid plans.',
  },
  {
    q: 'How do I pay?',
    a: 'We use a manual payment process via JazzCash, EasyPaisa, or bank transfer. After paying, submit your transaction reference on the Upgrade page. Our team activates your plan within a few hours.',
  },
  {
    q: 'How do plan unlocks work?',
    a: 'After your plan is activated, log in to the desktop app with the same email. Your plan, credits, and tool access will sync automatically from the same Supabase database.',
  },
  {
    q: 'Does the Free Trial renew?',
    a: 'No. Free Trial gives you 30 one-time credits. They do not renew monthly. Upgrade to a paid plan when you are ready for monthly credit allocation.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. All paid plans are monthly. You can request cancellation at any time by contacting our support team.',
  },
  {
    q: 'Is rendering done in the cloud?',
    a: 'No. SyncFrame Studio renders all videos locally on your machine. Your files never leave your device. Only your account email and plan status are synced with our servers.',
  },
]

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl glass border border-white/5 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-white/2 transition-colors"
      >
        <h3 className="text-white font-semibold text-base">{q}</h3>
        {open ? <ChevronUp size={18} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-slate-400 text-sm leading-relaxed px-6 pb-6">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function PricingPage() {
  const [plans, setPlans] = useState(PLANS)

  useEffect(() => {
    async function loadPlans() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('plans').select('*').eq('public_visible', true)
        if (data && !error && data.length > 0) {
          const merged = PLANS.map(staticPlan => {
            const dbPlan = data.find(p => p.id === staticPlan.id)
            if (dbPlan) {
              return {
                ...staticPlan,
                display_name: dbPlan.display_name,
                price_pkr: dbPlan.price_pkr,
                price_label: dbPlan.price_label || (dbPlan.price_pkr > 0 ? `Rs ${dbPlan.price_pkr}` : 'Free'),
                monthly_credits: dbPlan.monthly_credits,
                credits_note: dbPlan.short_description || staticPlan.credits_note,
                highlighted: dbPlan.is_popular
              }
            }
            return staticPlan
          })
          setPlans(merged)
        }
      } catch (err) {
        console.error('Failed to load dynamic plans:', err)
      }
    }
    if (supabase) loadPlans()
  }, [])

  return (
    <div className="w-full flex flex-col">
      <PageHeader
        badge="Pricing"
        badgeVariant="indigo"
        title="Simple pricing for"
        titleHighlight="every creator."
        description="Start free with 30 credits. Upgrade when you're ready. All plans include local rendering — your files stay on your machine."
      />

      {/* Pricing Cards */}
      <Section className="!pt-0">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`group relative flex flex-col rounded-3xl p-7 transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                  plan.highlighted
                    ? 'bg-[#0a0a0f] border border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.15)] hover:shadow-[0_0_50px_rgba(99,102,241,0.25)]'
                    : 'bg-[#05050a] border border-white/5 hover:border-white/10 shadow-xl hover:shadow-2xl'
                }`}
              >
                {/* Background glow */}
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
                )}
                {/* Top border */}
                <div className={`absolute top-0 left-0 w-full h-[2px] transition-opacity duration-300 ${plan.highlighted ? 'bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-100' : 'bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100'}`} />

                {plan.badge && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] uppercase tracking-wider font-bold px-4 py-1.5 rounded-b-xl shadow-lg shadow-indigo-500/30">
                      <Zap size={11} fill="white" className="animate-pulse" /> {plan.badge}
                    </span>
                  </div>
                )}

                <div className={`mb-7 ${plan.badge ? 'mt-5' : ''}`}>
                  <h3 className={`font-bold text-xl mb-2 ${plan.highlighted ? 'text-indigo-400' : 'text-white'}`}>
                    {plan.display_name}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-5">{plan.credits_note}</p>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className={`text-4xl font-black tracking-tight ${plan.highlighted ? 'text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70' : 'text-white'}`}>
                      {plan.price_label}
                    </span>
                    {plan.price_pkr && <span className="text-slate-400 font-medium">/ month</span>}
                  </div>
                </div>

                <ul className="space-y-3.5 mb-8 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-3 text-sm">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        plan.highlighted ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-slate-400 border border-white/5'
                      }`}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className={plan.highlighted ? 'text-slate-200' : 'text-slate-400'}>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === 'free' ? (
                  <Link to="/download" className="w-full text-center py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 bg-white/5 border border-white/10 text-white hover:border-indigo-500/30 hover:bg-white/10">
                    Download Free
                  </Link>
                ) : (
                  <Link
                    to={`/upgrade?plan=${plan.id}`}
                    className={`w-full text-center py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[1.02]'
                        : 'bg-white/5 border border-white/10 text-white hover:border-indigo-500/30 hover:bg-white/10'
                    }`}
                  >
                    Get {plan.display_name}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* Info Note */}
          <div className="mt-12 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex flex-col sm:flex-row items-start gap-4 max-w-3xl mx-auto">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Info size={20} />
            </div>
            <div className="flex-1 pt-1 sm:pt-0">
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-semibold block mb-1">How plan activation works</span>
                Pay via JazzCash, EasyPaisa, or bank transfer. Submit your transaction reference on the Upgrade page.
                Our team verifies and activates your plan. Log in to the desktop app with the same account to unlock your tools.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Feature Comparison Table */}
      <Section title="Plan comparison" className="bg-black/20">
        <Container className="max-w-5xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-slate-400 font-medium py-4 pr-6 w-1/3">Feature</th>
                  {['Free', 'Starter', 'Pro', 'Agency'].map(p => (
                    <th key={p} className={`text-center font-semibold py-4 px-4 w-1/6 ${p === 'Agency' ? 'text-indigo-400' : 'text-white'}`}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Credits', '30 once', '1,500/mo', '6,000/mo', '10,000/mo'],
                  ['Export quality', '720p', '1080p', '2K', '4K'],
                  ['Watermark', '✓', '—', '—', '—'],
                  ['Image Timeline', '✓', '✓', '✓', '✓'],
                  ['Video Timeline', '—', '✓', '✓', '✓'],
                  ['Audio Merger', '✓', '✓', '✓', '✓'],
                  ['Script Timestamp', '✓', '✓', '✓', '✓'],
                  ['Batch Generator', '—', '—', '✓', '✓'],
                  ['Premium templates', '—', '—', '✓', '✓'],
                  ['Commercial use', '—', '—', '—', '✓'],
                  ['Local rendering', '✓', '✓', '✓', '✓'],
                ].map(([feature, ...vals]) => (
                  <tr key={feature} className="hover:bg-white/2 transition-colors">
                    <td className="text-slate-400 py-4 pr-6">{feature}</td>
                    {vals.map((val, i) => (
                      <td key={i} className={`text-center py-4 px-4 ${
                        val === '✓' ? 'text-emerald-400' : val === '—' ? 'text-slate-600' : i === 3 ? 'text-indigo-300 font-medium' : 'text-slate-300'
                      }`}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section title="Frequently asked questions">
        <Container className="max-w-3xl">
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <FaqItem key={i} {...item} index={i} />
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        title="Start free today."
        description="Download SyncFrame Studio and get 30 credits to explore. No credit card needed."
        primaryLabel="Download App"
        primaryTo="/download"
        secondaryLabel="View Plans"
        secondaryTo="/pricing"
      />
    </div>
  )
}
