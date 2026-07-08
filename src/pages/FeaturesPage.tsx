import { motion } from 'framer-motion'
import {
  Film, Layers, Image, Video, FileText, Merge, BookTemplate,
  History, Cpu, Unlock, Coins, BarChart2, Zap
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FeatureCard from '../components/FeatureCard'
import CTASection from '../components/CTASection'
import Container from '../components/layout/Container'
import Section from '../components/layout/Section'

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
]

const platformFeatures = [
  { icon: <BarChart2 size={20} />, title: '720p – 4K Export', desc: 'Choose export resolution based on your plan: 720p, 1080p, 2K, or 4K.' },
  { icon: <Zap size={20} />, title: 'Fast Local Processing', desc: 'No round-trips to the cloud. Rendering speed limited only by your hardware.' },
  { icon: <Unlock size={20} />, title: 'Commercial Use Ready', desc: 'Agency plan includes commercial usage rights for all video exports.' },
]

export default function FeaturesPage() {
  return (
    <div className="w-full flex flex-col">
      <PageHeader
        badge="Full Feature Set"
        badgeVariant="violet"
        title="Every tool you need"
        titleHighlight="in one studio."
        description="SyncFrame Studio packs a complete video creation suite into a native desktop app. Build timelines, run batch jobs, and export in professional quality."
      />

      {/* Feature Grid */}
      <Section className="!pt-0">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <FeatureCard key={feat.title} {...feat} index={i} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Platform Details */}
      <Section
        title="Platform details"
        subtitle="Built for professional creators who need reliability and speed."
        className="bg-surface-925"
      >
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {platformFeatures.map((pf, i) => (
              <motion.div 
                key={pf.title} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-5 md:p-6 rounded-3xl bg-surface-900 border border-white/5 text-center flex flex-col h-full hover:bg-surface-850 hover:border-indigo-500/30 hover:-translate-y-2 transition-all duration-300 shadow-xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300">
                  {pf.icon}
                </div>
                <h3 className="text-white font-bold text-[17px] mb-2">{pf.title}</h3>
                <p className="text-slate-400 text-[13px] leading-relaxed flex-1">{pf.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

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
