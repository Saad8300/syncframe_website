import { type ReactNode } from 'react'
import { Download, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface DownloadCardProps {
  platform: string
  icon: ReactNode
  version: string
  releaseDate: string
  fileSize: string
  requirements: string[]
  comingSoon?: boolean
  index?: number
}

export default function DownloadCard({
  platform,
  icon,
  version,
  releaseDate,
  fileSize,
  requirements,
  comingSoon = true,
  index = 0,
}: DownloadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative glass-strong rounded-2xl p-8 border border-white/8 hover:border-indigo-500/20 transition-all duration-300 group"
    >
      {comingSoon && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1">
            <Clock size={10} />
            Coming Soon
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl glass border border-white/10 flex items-center justify-center text-slate-300 group-hover:border-indigo-500/20 group-hover:text-indigo-400 transition-all">
          {icon}
        </div>
        <div>
          <h3 className="text-white font-bold text-xl">{platform}</h3>
          <p className="text-slate-400 text-sm">{fileSize}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-xl p-3">
          <p className="text-slate-500 text-xs mb-1">Version</p>
          <p className="text-white font-semibold text-sm">{version}</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-slate-500 text-xs mb-1">Release</p>
          <p className="text-white font-semibold text-sm">{releaseDate}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-3">Requirements</p>
        <ul className="space-y-1.5">
          {requirements.map((req, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
              {req}
            </li>
          ))}
        </ul>
      </div>

      <button
        disabled={comingSoon}
        className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
          comingSoon
            ? 'bg-white/4 text-slate-500 cursor-not-allowed border border-white/5'
            : 'btn-primary'
        }`}
      >
        <Download size={16} />
        {comingSoon ? `Download for ${platform} — Coming Soon` : `Download for ${platform}`}
      </button>
    </motion.div>
  )
}
