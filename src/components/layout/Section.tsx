import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import Container from './Container'

interface SectionProps {
  children: ReactNode
  className?: string
  id?: string
  title?: string
  subtitle?: string
  badge?: string
}

export default function Section({
  children,
  className = '',
  id,
  title,
  subtitle,
  badge
}: SectionProps) {
  return (
    <section id={id} className={`relative w-full py-16 md:py-24 overflow-hidden ${className}`}>
      {/* If heading content is provided, render the standardized header block */}
      {(title || subtitle || badge) && (
        <Container className="mb-12 md:mb-16">
          <motion.div
            className="text-center w-full max-w-3xl mx-auto flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {badge && (
              <span className="inline-block text-sm font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-4">
                {badge}
              </span>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </motion.div>
        </Container>
      )}
      
      {/* Section Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </section>
  )
}
