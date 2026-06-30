import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  gradient?: boolean
}

export default function GlassCard({ children, className = '', hover = false, glow = false, gradient = false }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      className={`
        rounded-2xl
        ${gradient ? 'gradient-border' : ''}
        ${glow ? 'glass-strong' : 'glass'}
        ${glow ? 'glow-indigo' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}
