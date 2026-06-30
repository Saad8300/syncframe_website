import {
  Film, Layers, Image, Video, FileText, Merge, BookTemplate,
  History, Cpu, Webhook, Unlock, Coins, BarChart2, Zap
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FeatureCard from '../components/FeatureCard'
import CTASection from '../components/CTASection'

const features = [
  {
    icon: <Image size={22} />,
    title: 'Image Timeline Video Generator',
    description: 'Transform sequences of images and audio into cohesive, timeline-synced videos with precise frame-by-frame control.',
    color: 'indigo' as const,
    badge: 'Core Tool',
  },
  {
    icon: <Video size={22} />,
    title: 'Video Timeline Generator',
    description: 'Combine video clips on a visual timeline editor to craft polished multi-segment videos with seamless transitions.',
    color: 'violet' as const,
  },
  {
    icon: <Film size={22} />,
    title: 'Media Timeline Generator',
    description: 'Mix images, video clips, and audio assets on a unified timeline for maximum creative flexibility.',
    color: 'blue' as const,
  },
  {
    icon: <Layers size={22} />,
    title: 'Batch Video Generator',
    description: 'Generate hundreds of unique videos from templates, structured data, and asset lists with one click.',
    color: 'violet' as const,
    badge: 'Pro+',
  },
  {
    icon: <FileText size={22} />,
    title: 'Script Timestamp Tool',
    description: 'Auto-extract timestamps from scripts or audio transcriptions to perfectly align visual cuts with spoken content.',
    color: 'cyan' as const,
  },
  {
    icon: <Merge size={22} />,
    title: 'Audio Merger',
    description: 'Merge multiple audio tracks — narration, music, effects — into a single synchronized audio stream for export.',
    color: 'blue' as const,
  },
  {
    icon: <BookTemplate size={22} />,
    title: 'Templates',
    description: 'Save and reuse video project templates across different content series to speed up repetitive workflows.',
    color: 'indigo' as const,
  },
  {
    icon: <History size={22} />,
    title: 'History',
    description: 'Browse past generations with metadata, settings, and exports saved locally for full reproducibility.',
    color: 'emerald' as const,
  },
  {
    icon: <Cpu size={22} />,
    title: 'Local Rendering',
    description: 'All video processing and rendering happens entirely on your machine. Fast, private, and offline-capable.',
    color: 'emerald' as const,
    badge: 'Privacy First',
  },
  {
    icon: <Webhook size={22} />,
    title: 'n8n Webhook Automation',
    description: 'Trigger video generation pipelines from external automation tools like n8n. Receive webhook notifications on completion.',
    color: 'amber' as const,
    badge: 'Pro+',
  },
  {
    icon: <Unlock size={22} />,
    title: 'Plan-Based Tool Unlocks',
    description: 'Tools and capabilities automatically unlock based on your subscription tier when you log in with your account.',
    color: 'violet' as const,
  },
  {
    icon: <Coins size={22} />,
    title: 'Credit System',
    description: 'Each plan includes monthly credits. Credits are consumed per export. Purchase more credits or upgrade your plan anytime.',
    color: 'amber' as const,
  },
]

const platformFeatures = [
  { icon: <BarChart2 size={20} />, title: '720p – 4K Export', desc: 'Choose export resolution based on your plan: 720p, 1080p, 2K, or 4K.' },
  { icon: <Zap size={20} />, title: 'Fast Local Processing', desc: 'No round-trips to the cloud. Rendering speed limited only by your hardware.' },
  { icon: <Unlock size={20} />, title: 'Commercial Use Ready', desc: 'Ultra plan includes commercial usage rights for all video exports.' },
]

export default function FeaturesPage() {
  return (
    <div>
      <PageHeader
        badge="Full Feature Set"
        badgeVariant="violet"
        title="Every tool you need"
        titleHighlight="in one studio."
        description="SyncFrame Studio packs a complete video creation suite into a native desktop app. Build timelines, run batch jobs, automate with webhooks, and export in professional quality."
      />

      {/* Feature Grid */}
      <section className="relative pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <FeatureCard key={feat.title} {...feat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Platform Details */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 mesh-bg" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Platform details</h2>
            <p className="text-slate-400">Built for professional creators who need reliability and speed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {platformFeatures.map((pf, i) => (
              <div key={pf.title} className="p-6 rounded-2xl glass border border-white/5 text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  {pf.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{pf.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{pf.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to build your"
        titleHighlight="video workflow?"
        description="Download SyncFrame Studio and start creating synced videos with your first 30 free credits."
        primaryLabel="Download App"
        primaryTo="/download"
        secondaryLabel="See Pricing"
        secondaryTo="/pricing"
      />
    </div>
  )
}
