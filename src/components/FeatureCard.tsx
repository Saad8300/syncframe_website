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
    iconBg: 'from-indigo-500/10 to-violet-500/10 text-indigo-400 border-indigo-500/20 group-hover:from-indigo-500 group-hover:to-violet-500 group-hover:text-white',
    borderLight: 'from-indigo-500',
    glow: 'from-indigo-500/0 to-indigo-500/10',
    outerGlow: 'group-hover:shadow-[0_0_25px_rgba(99,102,241,0.2)]',
    badge: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  },
  violet: {
    iconBg: 'from-violet-500/10 to-purple-500/10 text-violet-400 border-violet-500/20 group-hover:from-violet-500 group-hover:to-purple-500 group-hover:text-white',
    borderLight: 'from-violet-500',
    glow: 'from-violet-500/0 to-violet-500/10',
    outerGlow: 'group-hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]',
    badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  },
  blue: {
    iconBg: 'from-blue-500/10 to-cyan-500/10 text-blue-400 border-blue-500/20 group-hover:from-blue-500 group-hover:to-cyan-500 group-hover:text-white',
    borderLight: 'from-blue-500',
    glow: 'from-blue-500/0 to-blue-500/10',
    outerGlow: 'group-hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]',
    badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  },
  cyan: {
    iconBg: 'from-cyan-500/10 to-teal-500/10 text-cyan-400 border-cyan-500/20 group-hover:from-cyan-500 group-hover:to-teal-500 group-hover:text-white',
    borderLight: 'from-cyan-500',
    glow: 'from-cyan-500/0 to-cyan-500/10',
    outerGlow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]',
    badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  },
  emerald: {
    iconBg: 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20 group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:text-white',
    borderLight: 'from-emerald-500',
    glow: 'from-emerald-500/0 to-emerald-500/10',
    outerGlow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  },
  amber: {
    iconBg: 'from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20 group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white',
    borderLight: 'from-amber-500',
    glow: 'from-amber-500/0 to-amber-500/10',
    outerGlow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]',
    badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  },
}

export default function FeatureCard({ icon, title, description, badge, index = 0, color = 'indigo' }: FeatureCardProps) {
  const colors = colorMap[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={`group relative p-5 md:p-6 rounded-3xl bg-[#0a0a0f] border border-white/5 transition-all duration-300 cursor-default hover:-translate-y-2 hover:border-white/10 ${colors.outerGlow} overflow-hidden`}
    >
      {/* Top border highlight */}
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${colors.borderLight} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      {/* Subtle internal gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br border ${colors.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300`}>
        {icon}
      </div>
      
      {badge && (
        <span className={`inline-block text-[10px] uppercase tracking-wider font-bold border rounded-full px-2.5 py-0.5 mb-3 ${colors.badge}`}>
          {badge}
        </span>
      )}
      <h3 className="text-white font-bold text-[17px] mb-2 leading-snug group-hover:text-white transition-colors">{title}</h3>
      <p className="text-slate-400 text-[13px] leading-relaxed">{description}</p>
    </motion.div>
  )
}
