import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PricingCard from '../components/PricingCard'
import CTASection from '../components/CTASection'

const plans = [
  {
    name: 'Free Trial',
    price: 'Free',
    priceNote: 'one-time',
    description: 'Explore the app and see if SyncFrame fits your workflow.',
    features: [
      '30 one-time credits',
      '3 video exports',
      '720p export resolution',
      'Watermark on exports',
      'Basic timeline tools',
      'Local rendering',
    ],
    ctaLabel: 'Download App',
    ctaTo: '/download',
    ctaVariant: 'secondary' as const,
    highlighted: false,
  },
  {
    name: 'Standard',
    price: '$19',
    priceNote: '/ month',
    description: 'For creators producing regular content who need reliable tools.',
    features: [
      '500 credits / month',
      '1080p export resolution',
      'No watermark',
      'Basic timeline tools',
      'History access',
      'Limited templates',
      'Local rendering',
    ],
    ctaLabel: 'Join Waitlist',
    ctaTo: '/contact',
    ctaVariant: 'secondary' as const,
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    priceNote: '/ month',
    description: 'For power creators and small teams who batch-generate at scale.',
    features: [
      '2,000 credits / month',
      '2K export resolution',
      'Batch Video Generator',
      'Premium templates',
      'n8n webhook automation',
      'No watermark',
      'History access',
      'Local rendering',
    ],
    ctaLabel: 'Join Waitlist',
    ctaTo: '/contact',
    ctaVariant: 'primary' as const,
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Ultra',
    price: '$149',
    priceNote: '/ month',
    description: 'For high-volume agencies and enterprise creators with large batch needs.',
    features: [
      '10,000 credits / month',
      '4K export resolution',
      'Large batch generation',
      'All tools unlocked',
      'Commercial usage rights',
      'Priority high-volume usage',
      'n8n webhook automation',
      'No watermark',
    ],
    ctaLabel: 'Join Waitlist',
    ctaTo: '/contact',
    ctaVariant: 'secondary' as const,
    highlighted: false,
  },
]

const faqItems = [
  {
    q: 'What are credits?',
    a: 'Credits are consumed per video export. The exact credit cost depends on video length, resolution, and complexity. Credits refresh monthly on paid plans.',
  },
  {
    q: 'When will payments be available?',
    a: 'Paid plans are coming soon. Join the waitlist to get notified first and receive an early-access discount.',
  },
  {
    q: 'How do plan unlocks work in the desktop app?',
    a: 'When you purchase a plan on the website and log in to the desktop app with the same email, your tools and credit balance will unlock automatically.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Yes. We offer a 7-day refund window for new paid subscriptions if you are not satisfied.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. All plans are subscription-based and can be cancelled at any time from your account page.',
  },
]

export default function PricingPage() {
  return (
    <div>
      <PageHeader
        badge="Pricing"
        badgeVariant="indigo"
        title="Simple pricing for"
        titleHighlight="every creator."
        description="Start free with 30 credits. Upgrade when you're ready. All plans include local rendering and no cloud upload."
      />

      {/* Pricing Cards */}
      <section className="relative pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-5">
            {plans.map((plan, i) => (
              <PricingCard key={plan.name} {...plan} index={i} />
            ))}
          </div>

          {/* Integration Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-10 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex items-start gap-4 max-w-3xl mx-auto"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Info size={16} />
            </div>
            <div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-semibold">How plan activation works:</span>{' '}
                Plans and payments will be activated through the SyncFrame website. The desktop app will automatically unlock tools when you log in with the same account.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="relative py-16">
        <div className="absolute inset-0 mesh-bg" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Plan comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-slate-400 font-medium py-3 pr-6">Feature</th>
                  {['Free', 'Standard', 'Pro', 'Ultra'].map(p => (
                    <th key={p} className={`text-center font-semibold py-3 px-4 ${p === 'Pro' ? 'text-indigo-400' : 'text-white'}`}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Credits / month', '30 once', '500', '2,000', '10,000'],
                  ['Export resolution', '720p', '1080p', '2K', '4K'],
                  ['Watermark', '✓', '—', '—', '—'],
                  ['Batch Generator', '—', '—', '✓', '✓'],
                  ['n8n Webhook', '—', '—', '✓', '✓'],
                  ['Premium templates', '—', '—', '✓', '✓'],
                  ['Commercial use', '—', '—', '—', '✓'],
                  ['History', '—', '✓', '✓', '✓'],
                  ['Local rendering', '✓', '✓', '✓', '✓'],
                ].map(([feature, ...vals]) => (
                  <tr key={feature} className="hover:bg-white/2">
                    <td className="text-slate-400 py-3.5 pr-6">{feature}</td>
                    {vals.map((val, i) => (
                      <td key={i} className={`text-center py-3.5 px-4 ${
                        val === '✓' ? 'text-emerald-400' : val === '—' ? 'text-slate-600' : i === 2 ? 'text-indigo-300 font-medium' : 'text-slate-300'
                      }`}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-xl glass border border-white/5"
              >
                <h3 className="text-white font-semibold text-sm mb-2">{item.q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Start free today."
        description="Download SyncFrame Studio and get 30 credits to explore. No credit card needed."
        primaryLabel="Download App"
        primaryTo="/download"
        secondaryLabel="Contact Us"
        secondaryTo="/contact"
      />
    </div>
  )
}
