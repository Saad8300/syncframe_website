import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import Container from './layout/Container'
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
    <section className="relative w-full pt-[120px] md:pt-[140px] pb-16 md:pb-20 overflow-hidden">
      {/* Subtle Background effects */}
      <div className="absolute inset-0 mesh-bg opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center w-full max-w-4xl mx-auto space-y-6"
        >
          {badge && (
            <Badge variant={badgeVariant} size="md">{badge}</Badge>
          )}
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
            {title}
            {titleHighlight && (
              <span className="gradient-text"> {titleHighlight}</span>
            )}
          </h1>
          
          <p className="text-base md:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
          
          {children && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 w-full">
              {children}
            </div>
          )}
        </motion.div>
      </Container>
    </section>
  )
}
