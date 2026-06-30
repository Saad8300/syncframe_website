import { motion } from 'framer-motion'
import { Apple, Monitor, Shield, ChevronRight, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import DownloadCard from '../components/DownloadCard'

const installationSteps = [
  { step: 1, title: 'Download the installer', desc: 'Click the download button for your platform (Mac or Windows).' },
  { step: 2, title: 'Run the installer', desc: 'Open the downloaded file and follow the setup wizard.' },
  { step: 3, title: 'Launch SyncFrame Studio', desc: 'Open the app from your Applications folder or desktop shortcut.' },
  { step: 4, title: 'Create your account', desc: 'Sign up or log in with your email to sync your plan and credits.' },
  { step: 5, title: 'Start creating', desc: 'You start with 30 free credits. Begin your first timeline video right away.' },
]

export default function DownloadPage() {
  return (
    <div>
      <PageHeader
        badge="Download"
        badgeVariant="green"
        title="Download SyncFrame"
        titleHighlight="Studio"
        description="A native desktop app for Mac and Windows. Local rendering, no cloud upload, full creative control."
      >
        <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>v1.0.0 — Coming Soon · Mac & Windows</span>
        </div>
      </PageHeader>

      {/* Download Cards */}
      <section className="relative pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DownloadCard
              platform="Mac"
              icon={<Apple size={28} />}
              version="v1.0.0 — Coming Soon"
              releaseDate="TBA 2025"
              fileSize="~120 MB (est.)"
              requirements={[
                'macOS 12 Monterey or later',
                'Apple Silicon or Intel Mac',
                '8 GB RAM minimum',
                '2 GB free disk space',
                'Internet for account sync',
              ]}
              comingSoon
              index={0}
            />
            <DownloadCard
              platform="Windows"
              icon={<Monitor size={28} />}
              version="v1.0.0 — Coming Soon"
              releaseDate="TBA 2025"
              fileSize="~140 MB (est.)"
              requirements={[
                'Windows 10 version 1903 or later',
                'Windows 11 supported',
                '8 GB RAM minimum',
                '2 GB free disk space',
                'Internet for account sync',
              ]}
              comingSoon
              index={1}
            />
          </div>
        </div>
      </section>

      {/* Security Note */}
      <section className="relative py-16">
        <div className="absolute inset-0 mesh-bg" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-4"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Safe and private by design</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                SyncFrame Studio processes all videos locally on your machine. Your media files never leave your device. Only your account email and plan status are synced with our servers for authentication. We never have access to your video content.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="relative py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Installation guide</h2>
          <div className="relative space-y-0">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 via-violet-500/20 to-transparent" />
            {installationSteps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative flex items-start gap-6 pb-8 last:pb-0"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold text-sm flex items-center justify-center z-10">
                  {step.step}
                </div>
                <div className="pt-1.5">
                  <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Changelog CTA */}
      <section className="relative py-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <BookOpen size={20} className="text-indigo-400" />
            <span className="text-slate-400 text-sm">See what's new in every release</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Read the Changelog</h2>
          <p className="text-slate-400 text-sm mb-6">New features, improvements, and bug fixes are documented in full on the changelog page.</p>
          <Link to="/changelog" className="btn-secondary inline-flex items-center gap-2">
            View Changelog <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
