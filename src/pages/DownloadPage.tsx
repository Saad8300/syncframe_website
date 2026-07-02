import { motion } from 'framer-motion'
import { Apple, Monitor, Shield, ChevronRight, BookOpen, Download, AlertTriangle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Container from '../components/layout/Container'
import Section from '../components/layout/Section'

const APP_VERSION = 'v0.1.1-stable'
const WIN_URL = import.meta.env.VITE_WINDOWS_DOWNLOAD_URL as string | undefined
const MAC_URL = import.meta.env.VITE_MAC_DOWNLOAD_URL as string | undefined

const installationSteps = [
  { step: 1, title: 'Download the installer', desc: 'Click the download button for your platform (Mac or Windows).' },
  { step: 2, title: 'Run the installer', desc: 'Open the downloaded file. On Windows, run the .exe. On Mac, open the .dmg and drag SyncFrame to Applications.' },
  { step: 3, title: 'Launch SyncFrame Studio', desc: 'Open the app from your Applications folder or Windows Start menu.' },
  { step: 4, title: 'Log in with your account', desc: 'Sign in with your SyncFrame account email to sync your plan and credits.' },
  { step: 5, title: 'Start creating', desc: 'You start with 30 free credits. Begin your first timeline video right away.' },
]

interface DownloadCardProps {
  platform: 'Mac' | 'Windows'
  icon: React.ReactNode
  requirements: string[]
  downloadUrl?: string
  warningNote?: string
  index: number
}

function PlatformCard({ platform, icon, requirements, downloadUrl, warningNote, index }: DownloadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative glass-strong rounded-2xl p-8 border border-white/8 hover:border-indigo-500/20 transition-all duration-300 group flex flex-col"
    >
      {/* Platform header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl glass border border-white/10 flex items-center justify-center text-slate-300 group-hover:border-indigo-500/20 group-hover:text-indigo-400 transition-all">
          {icon}
        </div>
        <div>
          <h3 className="text-white font-bold text-xl">{platform}</h3>
          <p className="text-indigo-400 text-sm font-medium">{APP_VERSION}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-xl p-3">
          <p className="text-slate-500 text-xs mb-1">Version</p>
          <p className="text-white font-semibold text-sm">{APP_VERSION}</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-slate-500 text-xs mb-1">Platform</p>
          <p className="text-white font-semibold text-sm">{platform === 'Mac' ? 'macOS 12+' : 'Windows 10+'}</p>
        </div>
      </div>

      {/* Requirements */}
      <div className="mb-6 flex-1">
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

      {/* Warning note */}
      {warningNote && (
        <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300/80 text-xs leading-relaxed">{warningNote}</p>
        </div>
      )}

      {/* Download Button */}
      {downloadUrl ? (
        <a
          href={downloadUrl}
          className="btn-primary w-full justify-center py-3.5 flex items-center gap-2"
        >
          <Download size={16} />
          Download for {platform}
        </a>
      ) : (
        <div className="w-full">
          <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/4 text-slate-500 border border-white/5 text-sm cursor-not-allowed mb-3">
            <Download size={16} />
            {platform} download coming soon
          </div>
          <Link to="/contact" className="flex items-center justify-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs transition-colors">
            <ExternalLink size={12} /> Contact support for early access
          </Link>
        </div>
      )}
    </motion.div>
  )
}

export default function DownloadPage() {
  return (
    <div className="w-full flex flex-col">
      <PageHeader
        badge="Download"
        badgeVariant="green"
        title="Download SyncFrame"
        titleHighlight="Studio"
        description="A native desktop app for Mac and Windows. Local rendering, no cloud upload, full creative control."
      >
        <div className="flex items-center gap-2 text-sm text-slate-400 mt-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{APP_VERSION} · Mac & Windows · Stable Release</span>
        </div>
      </PageHeader>

      {/* Download Cards */}
      <Section className="!pt-0">
        <Container className="max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PlatformCard
              platform="Mac"
              icon={<Apple size={28} />}
              requirements={[
                'macOS 12 Monterey or later',
                'Apple Silicon or Intel Mac',
                '8 GB RAM minimum',
                '2 GB free disk space',
                'Internet for account sync',
              ]}
              downloadUrl={MAC_URL}
              warningNote="If macOS blocks the app, go to System Settings → Privacy & Security and click 'Open Anyway'."
              index={0}
            />
            <PlatformCard
              platform="Windows"
              icon={<Monitor size={28} />}
              requirements={[
                'Windows 10 (version 1903) or later',
                'Windows 11 fully supported',
                '8 GB RAM minimum',
                '2 GB free disk space',
                'Internet for account sync',
              ]}
              downloadUrl={WIN_URL}
              warningNote="If Windows shows 'Unknown Publisher', click 'More info' → 'Run anyway' to proceed."
              index={1}
            />
          </div>
        </Container>
      </Section>

      {/* Privacy Note */}
      <Section className="bg-black/20">
        <Container className="max-w-3xl">
          <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex flex-col sm:flex-row items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">Safe and private by design</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                SyncFrame Studio processes all videos locally on your machine. Your media files never leave your device.
                Only your account email and plan status are synced with our servers for authentication.
                We never have access to your video content.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Installation Steps */}
      <Section title="Installation guide">
        <Container className="max-w-3xl">
          <div className="relative space-y-0 pl-4 sm:pl-0">
            <div className="absolute left-9 sm:left-5 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 via-violet-500/20 to-transparent" />
            {installationSteps.map((step) => (
              <div key={step.step} className="relative flex items-start gap-6 pb-10 last:pb-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#09090f] border border-indigo-500/30 text-indigo-400 font-bold text-sm flex items-center justify-center z-10 relative shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  {step.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Changelog CTA */}
      <Section className="bg-gradient-to-t from-[#05050a] to-transparent">
        <Container className="max-w-xl text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-5">
            <BookOpen size={20} className="text-indigo-400" />
            <span className="text-slate-400 text-sm font-medium">See what's new in every release</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Read the Changelog</h2>
          <p className="text-slate-400 mb-8">New features, improvements, and bug fixes are documented in full on the changelog page.</p>
          <Link to="/changelog" className="btn-secondary inline-flex items-center gap-2">
            View Changelog <ChevronRight size={16} />
          </Link>
        </Container>
      </Section>
    </div>
  )
}
