import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Play, Zap, Shield, Globe, Users, Monitor, Layers,
  Film, Clock, Merge, FileText, Cpu, Webhook, Star, ChevronRight
} from 'lucide-react'
import CTASection from '../components/CTASection'

const highlights = [
  { icon: <Film size={20} />, title: 'Timeline Video Creation', desc: 'Build perfectly synced videos frame by frame with audio and image timelines.' },
  { icon: <Layers size={20} />, title: 'Batch Generation', desc: 'Generate hundreds of videos from structured data and templates automatically.' },
  { icon: <Clock size={20} />, title: 'Timestamp Tools', desc: 'Auto-parse timestamps from scripts and audio to drive precise video cuts.' },
  { icon: <Merge size={20} />, title: 'Audio Merger', desc: 'Combine multiple audio tracks into one clean output ready for export.' },
  { icon: <Cpu size={20} />, title: 'Local Rendering', desc: 'All rendering happens on your machine. No cloud uploads. Fast and private.' },
  { icon: <Webhook size={20} />, title: 'n8n Webhook Automation', desc: 'Trigger video generation from external automation workflows seamlessly.' },
]

const workflow = [
  { step: '01', title: 'Import your assets', desc: 'Drag in audio files, images, scripts, and timestamp data.' },
  { step: '02', title: 'Build your timeline', desc: 'Arrange assets on the visual timeline editor with millisecond precision.' },
  { step: '03', title: 'Apply a template', desc: 'Use pre-built templates or create your own reusable workflows.' },
  { step: '04', title: 'Batch & export', desc: 'Generate dozens of videos at once. Export at 720p, 1080p, 2K or 4K.' },
]

const useCases = [
  { icon: <Users size={18} />, title: 'Content Creators', desc: 'Produce synced videos at scale for YouTube, social media, and podcasts.' },
  { icon: <FileText size={18} />, title: 'Script Producers', desc: 'Turn spoken scripts into timed visual presentations automatically.' },
  { icon: <Globe size={18} />, title: 'Agencies', desc: 'Automate client video deliverables with batch generation and webhooks.' },
  { icon: <Monitor size={18} />, title: 'Developers', desc: 'Integrate with n8n and other automation tools via webhook triggers.' },
]

const trustPoints = [
  { icon: <Shield size={20} />, title: 'Local & Private', desc: 'Nothing leaves your machine. Rendering is 100% local.' },
  { icon: <Zap size={20} />, title: 'Mac & Windows', desc: 'Cross-platform desktop app. Native performance on both platforms.' },
  { icon: <Star size={20} />, title: 'Plan-Based Unlocks', desc: 'Tools unlock automatically based on your subscription tier.' },
]

function AppMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-3xl scale-95 -z-10" />
      {/* Window frame */}
      <div className="relative rounded-2xl glass-strong border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white/3 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white/5 rounded-lg h-6 flex items-center px-3">
              <span className="text-slate-500 text-xs font-mono">SyncFrame Studio — Project.sfx</span>
            </div>
          </div>
        </div>
        {/* App body */}
        <div className="grid grid-cols-[200px_1fr] min-h-[340px]">
          {/* Sidebar */}
          <div className="bg-white/2 border-r border-white/5 p-3 space-y-1">
            {['Timeline Editor', 'Batch Generator', 'Script Parser', 'Audio Merger', 'Templates', 'History'].map((item, i) => (
              <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${i === 0 ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                {item}
              </div>
            ))}
          </div>
          {/* Main area */}
          <div className="p-4 space-y-3">
            {/* Timeline */}
            <div className="glass rounded-xl p-3 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium">Timeline — project_batch_001</span>
                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">1080p</span>
              </div>
              <div className="space-y-2">
                {['Audio Track', 'Image Sequence', 'Overlay Layer'].map((track, i) => (
                  <div key={track} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-20 shrink-0">{track}</span>
                    <div className="flex-1 h-6 bg-white/3 rounded relative overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded opacity-70 ${
                          i === 0 ? 'bg-indigo-500 w-full' : i === 1 ? 'bg-violet-500 w-3/4' : 'bg-blue-500 w-1/2'
                        }`}
                      />
                      {/* Waveform dots */}
                      <div className="absolute inset-0 flex items-center gap-px px-2">
                        {Array.from({ length: 40 }).map((_, j) => (
                          <div key={j} className="flex-1 bg-white/20 rounded-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Status bar */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ready</span>
              <span>Credits: 1,847 remaining</span>
              <span>Pro Plan</span>
              <span className="ml-auto text-indigo-400">⌘ Export</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#09090f]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-indigo-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-violet-500/6 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[300px] bg-blue-500/5 rounded-full blur-3xl" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-6"
            >
              <span className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium px-4 py-2 rounded-full">
                <Zap size={14} fill="currentColor" />
                Local rendering · Mac & Windows · No cloud upload
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Create perfectly synced{' '}
              <span className="gradient-text">videos faster.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10"
            >
              Turn audio, images, timestamps, scripts, and batch workflows into polished videos with a powerful desktop studio.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/download" className="btn-primary text-base px-8 py-4">
                <Play size={18} fill="white" />
                Download App
                <ArrowRight size={16} />
              </Link>
              <Link to="/pricing" className="btn-secondary text-base px-8 py-4">
                View Pricing
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-500"
            >
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" />Free to download</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-400" />No credit card for trial</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-400" />Mac & Windows</span>
            </motion.div>
          </div>

          {/* App Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <AppMockup />
          </motion.div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="relative py-24">
        <div className="absolute inset-0 mesh-bg" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block text-sm font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-4">Core Features</span>
              <h2 className="text-4xl font-bold text-white mb-4">Everything you need to create</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">A comprehensive toolkit for timeline-based video creation, batch generation, and automated workflows.</p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="group p-6 rounded-2xl glass border border-white/5 hover:border-indigo-500/20 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/features" className="btn-ghost text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-2">
              View all features <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block text-sm font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full mb-4">How it works</span>
              <h2 className="text-4xl font-bold text-white mb-4">Creator workflow</h2>
              <p className="text-slate-400 max-w-xl mx-auto">From raw assets to polished export in four simple steps.</p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflow.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative p-6 rounded-2xl glass border border-white/5"
              >
                <div className="text-5xl font-black text-white/5 mb-3 leading-none">{step.step}</div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative py-24">
        <div className="absolute inset-0 mesh-bg" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="inline-block text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-4">Use Cases</span>
              <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Built for creators who work at scale</h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Whether you're a solo content creator, a production agency, or a developer automating pipelines, SyncFrame Studio adapts to your workflow.
              </p>
              <Link to="/features" className="btn-primary">
                Explore Features <ArrowRight size={16} />
              </Link>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {useCases.map((uc, i) => (
                <motion.div
                  key={uc.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 rounded-2xl glass border border-white/5 hover:border-indigo-500/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                    {uc.icon}
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-1">{uc.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{uc.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Security */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/3 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl glass-strong border border-white/8 p-10 md:p-16"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/5 to-violet-500/5" />
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
              {trustPoints.map((tp, i) => (
                <motion.div
                  key={tp.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                    {tp.icon}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{tp.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{tp.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Start creating videos"
        titleHighlight="the smart way."
        description="Download SyncFrame Studio for free and get 30 credits to explore the platform. No credit card required."
        primaryLabel="Download for Free"
        primaryTo="/download"
        secondaryLabel="View Pricing"
        secondaryTo="/pricing"
        badge="Free trial — 30 credits included"
      />
    </div>
  )
}
