// src/pages/DownloadPage.tsx
// Public Download page — uses secure signed URLs via get_release_download_url RPC.
// Downloads start directly without exposing permanent storage URLs.
// Backwards compatible: legacy download_url releases still work.

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Apple, Monitor, Shield, ChevronRight, BookOpen, Download,
  AlertTriangle, Loader2, CheckCircle2, RefreshCw, Calendar,
  HardDrive, Tag
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Container from '../components/layout/Container'
import Section from '../components/layout/Section'
import { supabase } from '../lib/supabaseClient'

// ─── Fallback (env-based) for when Supabase is unreachable ────────────────────
const FALLBACK_WIN_URL = import.meta.env.VITE_WINDOWS_DOWNLOAD_URL as string | undefined
const FALLBACK_MAC_URL = import.meta.env.VITE_MAC_DOWNLOAD_URL as string | undefined

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReleaseInfo {
  id: string
  version: string
  platform: 'windows' | 'mac'
  channel: string
  architecture: string
  file_name: string | null
  file_size_bytes: number | null
  release_notes: string | null
  created_at: string
  // download source
  storage_path: string | null
  download_url: string | null // legacy fallback
}

type DownloadState = 'idle' | 'preparing' | 'started' | 'error'

// ─── Installation Steps ───────────────────────────────────────────────────────
const installationSteps = [
  { step: 1, title: 'Download the installer', desc: 'Click the download button for your platform (Mac or Windows). The download will start automatically.' },
  { step: 2, title: 'Run the installer', desc: 'Open the downloaded file. On Windows, run the .exe. On Mac, open the .dmg and drag SyncFrame to Applications.' },
  { step: 3, title: 'Launch SyncFrame Studio', desc: 'Open the app from your Applications folder or Windows Start menu.' },
  { step: 4, title: 'Log in with your account', desc: 'Sign in with your SyncFrame account email to sync your plan and credits.' },
  { step: 5, title: 'Start creating', desc: 'You start with 30 free credits. Begin your first timeline video right away.' },
]

// ─── Platform Card ────────────────────────────────────────────────────────────
interface PlatformCardProps {
  platform: 'Mac' | 'Windows'
  icon: React.ReactNode
  requirements: string[]
  release: ReleaseInfo | null
  fallbackUrl?: string
  warningNote?: string
  index: number
}

function PlatformCard({ platform, icon, requirements, release, fallbackUrl, warningNote, index }: PlatformCardProps) {
  const [dlState, setDlState] = useState<DownloadState>('idle')
  const [dlError, setDlError] = useState<string | null>(null)

  const hasRelease = !!release || !!fallbackUrl

  const handleDownload = useCallback(async () => {
    setDlError(null)

    // Case 1: Storage-based release — call secure RPC
    if (release?.id && release?.storage_path) {
      if (!supabase) {
        setDlError('Could not reach the download service. Please try again.')
        return
      }
      setDlState('preparing')
      try {
        const { data, error } = await supabase.functions.invoke('get-release-download', {
          body: { release_id: release.id }
        })
        if (error) throw error
        const url = data?.url
        if (!url) throw new Error('No download URL was returned.')

        // Trigger download
        const a = document.createElement('a')
        a.href = url
        a.download = release.file_name || `SyncFrame-${release.version}-${platform.toLowerCase()}.installer`
        a.rel = 'noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        setDlState('started')
        setTimeout(() => setDlState('idle'), 5000)
      } catch (err: any) {
        setDlState('error')
        setDlError(err.message || 'Download failed. Please try again.')
      }
      return
    }

    // Case 2: Legacy external URL
    const legacyUrl = release?.download_url || fallbackUrl
    if (legacyUrl) {
      window.open(legacyUrl, '_blank', 'noreferrer')
      setDlState('started')
      setTimeout(() => setDlState('idle'), 3000)
      return
    }

    setDlError('No download available.')
  }, [release, fallbackUrl, platform])

  const versionDisplay = release ? `v${release.version}` : '—'
  const channelDisplay = release?.channel === 'beta' ? 'Beta' : 'Stable'
  const sizeDisplay = formatBytes(release?.file_size_bytes)
  const dateDisplay = formatDate(release?.created_at)
  const archDisplay = release?.architecture || (platform === 'Mac' ? 'arm64 / x64' : 'x64')

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative bg-surface-900 rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl hover:border-indigo-500/30 transition-all duration-300 group flex flex-col"
    >
      {/* Platform header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-850 border border-white/10 flex items-center justify-center text-slate-300 group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-all shadow-sm">
            {icon}
          </div>
          <div>
            <h3 className="text-white font-bold text-2xl tracking-tight">{platform}</h3>
            <p className="text-indigo-400 text-sm font-medium mt-0.5">{channelDisplay} Release</p>
          </div>
        </div>

        {/* Quick version badge */}
        <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-surface-800 text-slate-300 text-sm font-semibold border border-white/10">
          {versionDisplay}
        </div>
      </div>

      {/* Structured metadata */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex items-center justify-between py-3 border-b border-white/5">
          <span className="text-slate-400 text-sm">Version</span>
          <span className="text-white font-medium text-sm">{versionDisplay}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-white/5">
          <span className="text-slate-400 text-sm">Architecture</span>
          <span className="text-white font-medium text-sm">{archDisplay}</span>
        </div>
        {sizeDisplay && (
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <span className="text-slate-400 text-sm flex items-center gap-1.5"><HardDrive size={14} /> Size</span>
            <span className="text-white font-medium text-sm">{sizeDisplay}</span>
          </div>
        )}
        {dateDisplay && (
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <span className="text-slate-400 text-sm flex items-center gap-1.5"><Calendar size={14} /> Released</span>
            <span className="text-white font-medium text-sm">{dateDisplay}</span>
          </div>
        )}
      </div>

      {/* Requirements */}
      <div className="mb-8 flex-1">
        <p className="text-white text-sm font-semibold mb-4">System Requirements</p>
        <ul className="space-y-2.5">
          {requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="leading-tight">{req}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Warning note */}
      {warningNote && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300/90 text-sm leading-relaxed">{warningNote}</p>
        </div>
      )}

      {/* Download error */}
      {dlError && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm leading-relaxed">{dlError}</p>
            <button
              onClick={() => { setDlError(null); setDlState('idle') }}
              className="mt-2 text-sm text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors font-medium"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Download Button */}
      {hasRelease ? (
        <button
          onClick={handleDownload}
          disabled={dlState === 'preparing'}
          className="w-full justify-center py-4 flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5"
        >
          {dlState === 'preparing' ? (
            <><Loader2 size={20} className="animate-spin" /> Preparing download…</>
          ) : dlState === 'started' ? (
            <><CheckCircle2 size={20} /> Download started!</>
          ) : (
            <><Download size={20} /> Download for {platform}</>
          )}
        </button>
      ) : (
        <div className="w-full">
          <div className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-surface-850 text-slate-400 border border-white/5 text-base font-medium cursor-not-allowed mb-3">
            <Download size={20} />
            {platform} coming soon
          </div>
          <Link to="/contact" className="flex items-center justify-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
            Contact support for early access
          </Link>
        </div>
      )}

      {/* File info below button */}
      {release?.file_name && dlState === 'idle' && (
        <p className="text-sm text-slate-400 text-center mt-4 flex items-center justify-center gap-2">
          <Tag size={12} className="opacity-70" />
          {release.file_name}
        </p>
      )}
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DownloadPage() {
  const [winRelease, setWinRelease] = useState<ReleaseInfo | null>(null)
  const [macRelease, setMacRelease] = useState<ReleaseInfo | null>(null)
  const [latestVersion, setLatestVersion] = useState<string>('Latest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReleases() {
      if (!supabase) { setLoading(false); return }

      try {
        const { data, error } = await supabase
          .from('app_releases')
          .select('id, version, platform, channel, architecture, file_name, file_size_bytes, release_notes, created_at, storage_path, download_url')
          .eq('is_published', true)
          .eq('is_latest', true)
          .eq('channel', 'stable')

        if (error) {
          console.error('Failed to fetch releases:', error)
          return
        }

        if (data && data.length > 0) {
          const win = data.find((r: any) => r.platform === 'windows') || null
          const mac = data.find((r: any) => r.platform === 'mac') || null

          if (win) setWinRelease(win as ReleaseInfo)
          if (mac) setMacRelease(mac as ReleaseInfo)

          // Show version from either release
          const v = (win || mac)?.version
          if (v) setLatestVersion(`v${v}`)
        }
      } catch (err) {
        console.error('Error in fetchReleases', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReleases()
  }, [])

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
          <span>
            {loading ? 'Loading latest release…' : `${latestVersion} · Mac & Windows · Stable Release`}
          </span>
        </div>
      </PageHeader>

      {/* Download Cards */}
      <Section className="pt-8 pb-16 md:pt-12 md:pb-20">
        <Container className="max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
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
              release={macRelease}
              fallbackUrl={FALLBACK_MAC_URL}
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
              release={winRelease}
              fallbackUrl={FALLBACK_WIN_URL}
              warningNote="If Windows shows 'Unknown Publisher', click 'More info' → 'Run anyway' to proceed."
              index={1}
            />
          </div>
        </Container>
      </Section>

      {/* Privacy Note */}
      <Section className="bg-surface-925 border-y border-white/5 py-16 md:py-20">
        <Container className="max-w-4xl">
          <div className="p-10 rounded-3xl bg-emerald-500/5 border border-emerald-500/15 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left shadow-sm">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-xl mb-3">Safe and private by design</h3>
              <p className="text-slate-400 text-base leading-relaxed">
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
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-950 border border-indigo-500/30 text-indigo-400 font-bold text-sm flex items-center justify-center z-10 relative shadow-[0_0_15px_rgba(99,102,241,0.2)]">
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
      <Section className="bg-surface-925">
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
