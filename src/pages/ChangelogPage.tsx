import { motion } from 'framer-motion'
import { Sparkles, Bug, Wrench, Download, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Container from '../components/layout/Container'
import Section from '../components/layout/Section'

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
    <div className="w-full flex flex-col">
      <PageHeader
        badge="Changelog"
        badgeVariant="violet"
        title="What's new in"
        titleHighlight="SyncFrame Studio"
        description="Stay up to date with every new feature, improvement, and bug fix across all versions."
      />

      <Section className="!pt-0">
        <Container className="max-w-3xl">
          {changelog.map((release, releaseIdx) => {
            const status = statusConfig[release.status]
            return (
              <div key={release.version} className="relative">
                {/* Version Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-strong border border-white/10">
                      <Tag size={16} className="text-indigo-400" />
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
                  <div className="mb-8 p-6 md:p-8 rounded-2xl glass border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <h3 className="text-white font-semibold text-lg">New Features</h3>
                      <span className="text-xs font-medium text-slate-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full ml-auto">
                        {release.newFeatures.length} items
                      </span>
                    </div>
                    <ul className="space-y-4">
                      {release.newFeatures.map((feat, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 flex items-center justify-center mt-0.5">
                            <Sparkles size={12} />
                          </div>
                          <span className="text-slate-300 leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {release.improvements.length > 0 && (
                  <div className="mb-8 p-6 md:p-8 rounded-2xl glass border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                        <Wrench size={16} />
                      </div>
                      <h3 className="text-white font-semibold text-lg">Improvements</h3>
                    </div>
                    <ul className="space-y-4">
                      {release.improvements.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/10 border border-violet-500/10 text-violet-400 flex items-center justify-center mt-0.5">
                            <Wrench size={12} />
                          </div>
                          <span className="text-slate-300 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bug Fixes */}
                {release.bugFixes.length > 0 && (
                  <div className="mb-8 p-6 md:p-8 rounded-2xl glass border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Bug size={16} />
                      </div>
                      <h3 className="text-white font-semibold text-lg">Bug Fixes</h3>
                    </div>
                    <ul className="space-y-4">
                      {release.bugFixes.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 flex items-center justify-center mt-0.5">
                            <Bug size={12} />
                          </div>
                          <span className="text-slate-300 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Download CTA */}
                <div className="p-6 md:p-8 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="w-full sm:w-auto text-center sm:text-left flex flex-col">
                    <p className="text-white font-semibold text-base mb-1">Download the latest version</p>
                    <p className="text-slate-400 text-sm">Get {release.version} as soon as it launches.</p>
                  </div>
                  <Link to="/download" className="btn-primary py-3 w-full sm:w-auto whitespace-nowrap">
                    <Download size={16} />
                    Download App
                  </Link>
                </div>
              </div>
            )
          })}
        </Container>
      </Section>
    </div>
  )
}
