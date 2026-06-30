import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import Badge from './Badge'

interface PageHeaderProps {
  badge?: string
  badgeVariant?: 'indigo' | 'violet' | 'blue' | 'green' | 'amber' | 'rose'
  title: string
  titleHighlight?: string
  description: string
  children?: ReactNode
}

export default function PageHeader({
  badge,
  badgeVariant = 'indigo',
  title,
  titleHighlight,
  description,
  children,
}: PageHeaderProps) {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 mesh-bg" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {badge && (
            <div className="flex justify-center">
              <Badge variant={badgeVariant} size="md">{badge}</Badge>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {title}
            {titleHighlight && (
              <>
                {' '}
                <span className="gradient-text">{titleHighlight}</span>
              </>
            )}
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
          {children && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {children}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
