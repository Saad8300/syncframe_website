import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface CTASectionProps {
  title: string
  titleHighlight?: string
  description: string
  primaryLabel?: string
  primaryTo?: string
  secondaryLabel?: string
  secondaryTo?: string
  badge?: string
  children?: ReactNode
}

export default function CTASection({
  title,
  titleHighlight,
  description,
  primaryLabel = 'Get Started',
  primaryTo = '/download',
  secondaryLabel,
  secondaryTo,
  badge,
  children,
}: CTASectionProps) {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-violet-500/8 rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {badge && (
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium px-4 py-2 rounded-full">
              {badge}
            </div>
          )}

          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            {title}
            {titleHighlight && (
              <>
                {' '}
                <span className="gradient-text">{titleHighlight}</span>
              </>
            )}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">{description}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to={primaryTo} className="btn-primary text-base px-8 py-3.5">
              {primaryLabel}
              <ArrowRight size={16} />
            </Link>
            {secondaryLabel && secondaryTo && (
              <Link to={secondaryTo} className="btn-secondary text-base px-8 py-3.5">
                {secondaryLabel}
              </Link>
            )}
          </div>
          {children}
        </motion.div>
      </div>
    </section>
  )
}
