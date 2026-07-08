import { Check, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

interface PricingCardProps {
  name: string
  price: string
  priceNote?: string
  description: string
  features: string[]
  ctaLabel: string
  ctaTo?: string
  ctaVariant?: 'primary' | 'secondary' | 'ghost'
  badge?: string
  highlighted?: boolean
  index?: number
}

export default function PricingCard({
  name,
  price,
  priceNote,
  description,
  features,
  ctaLabel,
  ctaTo = '/download',
  ctaVariant = 'secondary',
  badge,
  highlighted = false,
  index = 0,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group relative flex flex-col rounded-3xl p-6 lg:p-8 ${
        highlighted
          ? 'bg-[#0a0a0f] border border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.15)] hover:shadow-[0_0_50px_rgba(99,102,241,0.25)]'
          : 'bg-surface-950 border border-white/5 hover:border-white/10 shadow-xl hover:shadow-2xl'
      } transition-all duration-500 hover:-translate-y-2 overflow-hidden`}
    >
      {/* Background glow for highlighted card */}
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      )}

      {/* Top border highlight */}
      <div className={`absolute top-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${highlighted ? 'bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-100' : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'}`} />

      {badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] uppercase tracking-wider font-bold px-4 py-1.5 rounded-b-xl shadow-lg shadow-indigo-500/30">
            <Zap size={12} fill="white" className="animate-pulse" />
            {badge}
          </span>
        </div>
      )}

      <div className={`mb-8 ${badge ? 'mt-4' : ''}`}>
        <h3 className={`font-bold text-xl mb-2 ${highlighted ? 'text-indigo-400' : 'text-white'}`}>{name}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">{description}</p>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={`text-4xl md:text-[40px] font-black tracking-tight whitespace-nowrap ${highlighted ? 'text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70' : 'text-white'}`}>{price}</span>
          {priceNote && <span className="text-slate-400 font-medium whitespace-nowrap">{priceNote}</span>}
        </div>
      </div>

      <ul className="space-y-4 mb-10 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shadow-inner ${
              highlighted ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'bg-surface-850 text-slate-400 border border-white/5'
            }`}>
              <Check size={11} strokeWidth={3} />
            </div>
            <span className={highlighted ? 'text-slate-200' : 'text-slate-400'}>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        to={ctaTo}
        className={`
          w-full text-center py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300
          ${ctaVariant === 'primary'
            ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[1.02]'
            : ctaVariant === 'secondary'
              ? 'bg-surface-850 border border-white/10 text-white hover:border-indigo-500/30 hover:bg-surface-800'
              : 'text-slate-400 hover:text-white border border-transparent hover:border-white/10 hover:bg-surface-850'
          }
        `}
      >
        {ctaLabel}
      </Link>
    </motion.div>
  )
}
