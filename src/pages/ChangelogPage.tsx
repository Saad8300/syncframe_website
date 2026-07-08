import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Bug, Wrench, Download, Tag, AlertCircle, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Container from '../components/layout/Container'
import Section from '../components/layout/Section'
import { supabase } from '../lib/supabaseClient'
import type { ChangelogEntry } from '../components/admin/adminTypes'

const fallbackChangelog = [
  {
    version: 'v1.0.0',
    title: 'Initial Release',
    label: 'Coming Soon',
    date: 'TBA 2025',
    category: 'release',
    content: `
- Image Timeline Video Generator
- Video Timeline Generator
- Media Timeline Generator
- Batch Video Generator (Pro+)
- Script Timestamp Tool
- Audio Merger
- Templates system
- History with full metadata
- Account login via email / Google
- Mac and Windows support
- Local rendering — no cloud upload

**Improvements:**
- Premium glassmorphism UI design
- Dark mode native interface
- Responsive layout across resolutions
- Low memory footprint with efficient rendering
    `,
  },
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  release: <Sparkles size={16} />,
  feature: <Sparkles size={16} />,
  improvement: <Wrench size={16} />,
  fix: <Bug size={16} />,
  security: <Shield size={16} />,
}

export default function ChangelogPage() {
  const [changelogs, setChangelogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChangelogs() {
      if (!supabase) {
        setChangelogs(fallbackChangelog)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('changelog_entries')
          .select('*')
          .eq('published', true)
          .order('published_at', { ascending: false })
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data && data.length > 0) {
          setChangelogs(data)
        } else {
          setChangelogs(fallbackChangelog)
        }
      } catch (err) {
        console.error('Failed to load changelogs:', err)
        setChangelogs(fallbackChangelog)
      } finally {
        setLoading(false)
      }
    }

    fetchChangelogs()
  }, [])

  return (
    <div className="w-full flex flex-col">
      <PageHeader
        badge="Changelog"
        badgeVariant="violet"
        title="What's new in"
        titleHighlight="SyncFrame Studio"
        description="Stay up to date with every new feature, improvement, and bug fix across all versions."
      />

      <Section className="!pt-0 min-h-[50vh]">
        <Container className="max-w-3xl">
          {loading ? (
            <div className="text-center text-slate-500 py-12">Loading changelog...</div>
          ) : (
            changelogs.map((release, releaseIdx) => {
              return (
                <div key={release.id || release.version} className="relative">
                  {/* Version Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-strong border border-white/10">
                        <Tag size={16} className="text-indigo-400" />
                        <span className="text-white font-bold text-lg">{release.version}</span>
                      </div>
                      <span className="inline-flex items-center text-xs font-medium border rounded-full px-3 py-1 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 capitalize">
                        {release.category || 'Release'}
                      </span>
                    </div>
                    <span className="text-slate-500 text-sm">
                      {release.published_at ? new Date(release.published_at).toLocaleDateString() : release.date}
                    </span>
                  </div>

                  <div className="mb-10 p-6 md:p-8 rounded-2xl bg-surface-900 border border-white/5 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        {CATEGORY_ICONS[release.category] || <Sparkles size={16} />}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">{release.title}</h3>
                        {release.summary && <p className="text-slate-400 text-sm mt-1">{release.summary}</p>}
                      </div>
                    </div>

                    <div className="prose prose-invert prose-indigo max-w-none text-slate-300 whitespace-pre-wrap">
                      {release.content}
                    </div>

                    {release.tags && release.tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {release.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="text-xs text-slate-400 bg-surface-850 border border-white/5 px-2.5 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {releaseIdx === 0 && (
                    <div className="mb-12 p-6 md:p-8 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="w-full sm:w-auto text-center sm:text-left flex flex-col">
                        <p className="text-white font-semibold text-base mb-1">Download the latest version</p>
                        <p className="text-slate-400 text-sm">Get {release.version} as soon as it launches.</p>
                      </div>
                      <Link to="/download" className="btn-primary py-3 w-full sm:w-auto whitespace-nowrap">
                        <Download size={16} />
                        Download App
                      </Link>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </Container>
      </Section>
    </div>
  )
}
