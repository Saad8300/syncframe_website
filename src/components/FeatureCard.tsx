import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  badge?: string
  index?: number
  color?: 'indigo' | 'violet' | 'blue' | 'cyan' | 'emerald' | 'amber'
}

const colorMap = {
  indigo: {
    icon: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    glow: 'group-hover:shadow-indigo-500/20',
    border: 'group-hover:border-indigo-500/30',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    glow: 'group-hover:shadow-violet-500/20',
    border: 'group-hover:border-violet-500/30',
  },
  blue: {
    icon: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    glow: 'group-hover:shadow-blue-500/20',
    border: 'group-hover:border-blue-500/30',
  },
  cyan: {
    icon: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    glow: 'group-hover:shadow-cyan-500/20',
    border: 'group-hover:border-cyan-500/30',
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    glow: 'group-hover:shadow-emerald-500/20',
    border: 'group-hover:border-emerald-500/30',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    glow: 'group-hover:shadow-amber-500/20',
    border: 'group-hover:border-amber-500/30',
  },
}

export default function FeatureCard({ icon, title, description, badge, index = 0, color = 'indigo' }: FeatureCardProps) {
  const colors = colorMap[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className={`group p-6 rounded-2xl glass border border-white/5 ${colors.border} transition-all duration-300 cursor-default hover:shadow-xl ${colors.glow}`}
    >
      <div className={`w-12 h-12 rounded-xl border ${colors.icon} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      {badge && (
        <span className="inline-block text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2.5 py-0.5 mb-3">
          {badge}
        </span>
      )}
      <h3 className="text-white font-semibold text-base mb-2 leading-snug">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}
