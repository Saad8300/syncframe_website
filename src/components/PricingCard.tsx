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
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`relative flex flex-col rounded-2xl p-8 ${
        highlighted
          ? 'bg-gradient-to-b from-indigo-500/15 to-violet-500/10 border border-indigo-500/30 shadow-2xl shadow-indigo-500/10'
          : 'glass border border-white/8 hover:border-white/12'
      } transition-all duration-300`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30">
            <Zap size={10} fill="white" />
            {badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-white font-bold text-lg mb-1">{name}</h3>
        <p className="text-slate-400 text-sm mb-4">{description}</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-extrabold ${highlighted ? 'gradient-text' : 'text-white'}`}>{price}</span>
          {priceNote && <span className="text-slate-400 text-sm">{priceNote}</span>}
        </div>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
              highlighted ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400'
            }`}>
              <Check size={11} strokeWidth={3} />
            </div>
            <span className="text-slate-300 leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        to={ctaTo}
        className={`
          w-full text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200
          ${ctaVariant === 'primary'
            ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5'
            : ctaVariant === 'secondary'
              ? 'glass border border-white/10 text-white hover:border-indigo-500/30 hover:bg-white/5'
              : 'text-slate-400 hover:text-white border border-transparent hover:border-white/10'
          }
        `}
      >
        {ctaLabel}
      </Link>
    </motion.div>
  )
}
