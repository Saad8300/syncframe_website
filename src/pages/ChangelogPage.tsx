import { motion } from 'framer-motion'
import { Sparkles, Bug, Wrench, Download, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const changelog = [
  {
    version: 'v1.0.0',
    label: 'Coming Soon',
    date: 'TBA 2025',
    status: 'upcoming' as const,
    newFeatures: [
      'Image Timeline Video Generator',
      'Video Timeline Generator',
      'Media Timeline Generator',
      'Batch Video Generator (Pro+)',
      'Script Timestamp Tool',
      'Audio Merger',
      'Templates system',
      'History with full metadata',
      'n8n Webhook Automation (Pro+)',
      'Plan-based tool unlocks',
      'Credit system with monthly refresh',
      'Account login via email / Google',
      'Mac and Windows support',
      'Local rendering — no cloud upload',
    ],
    bugFixes: [],
    improvements: [
      'Premium glassmorphism UI design',
      'Dark mode native interface',
      'Responsive layout across resolutions',
      'Low memory footprint with efficient rendering',
    ],
  },
]

const statusConfig = {
  upcoming: { label: 'Upcoming', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  stable: { label: 'Stable', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  beta: { label: 'Beta', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
}

export default function ChangelogPage() {
  return (
    <div>
      <PageHeader
        badge="Changelog"
        badgeVariant="violet"
        title="What's new in"
        titleHighlight="SyncFrame Studio"
        description="Stay up to date with every new feature, improvement, and bug fix across all versions."
      />

      <section className="relative pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {changelog.map((release, releaseIdx) => {
            const status = statusConfig[release.status]
            return (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: releaseIdx * 0.1 }}
                className="relative"
              >
                {/* Version Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-strong border border-white/10">
                      <Tag size={14} className="text-indigo-400" />
                      <span className="text-white font-bold text-lg">{release.version}</span>
                    </div>
                    <span className={`inline-flex items-center text-xs font-medium border rounded-full px-3 py-1 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <span className="text-slate-500 text-sm">{release.date}</span>
                </div>

                {/* New Features */}
                {release.newFeatures.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 p-6 rounded-2xl glass border border-white/5"
                  >
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Sparkles size={15} />
                      </div>
                      <h3 className="text-white font-semibold">New Features</h3>
                      <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full ml-auto">{release.newFeatures.length} items</span>
                    </div>
                    <ul className="space-y-3">
                      {release.newFeatures.map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mt-0.5">
                            <Sparkles size={10} />
                          </div>
                          <span className="text-slate-300">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Improvements */}
                {release.improvements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 p-6 rounded-2xl glass border border-white/5"
                  >
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                        <Wrench size={15} />
                      </div>
                      <h3 className="text-white font-semibold">Improvements</h3>
                    </div>
                    <ul className="space-y-3">
                      {release.improvements.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center mt-0.5">
                            <Wrench size={10} />
                          </div>
                          <span className="text-slate-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Bug Fixes */}
                {release.bugFixes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8 p-6 rounded-2xl glass border border-white/5"
                  >
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Bug size={15} />
                      </div>
                      <h3 className="text-white font-semibold">Bug Fixes</h3>
                    </div>
                    <ul className="space-y-3">
                      {release.bugFixes.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mt-0.5">
                            <Bug size={10} />
                          </div>
                          <span className="text-slate-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Download CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-white font-semibold text-sm mb-0.5">Download the latest version</p>
                    <p className="text-slate-400 text-xs">Get {release.version} as soon as it launches.</p>
                  </div>
                  <Link to="/download" className="btn-primary text-sm py-2.5 px-5 whitespace-nowrap">
                    <Download size={14} />
                    Download App
                  </Link>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
