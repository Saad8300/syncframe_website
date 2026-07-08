import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Play, Zap, Shield, Globe, Users, Monitor, Layers,
  Film, Clock, Merge, FileText, Cpu, Star, ChevronRight, Image, Video, BookTemplate
} from 'lucide-react'
import Container from '../components/layout/Container'
import Section from '../components/layout/Section'
import CTASection from '../components/CTASection'

const highlights = [
  { icon: <Film size={22} />, title: 'Timeline Video Creation', desc: 'Build perfectly synced videos frame by frame with audio and image timelines.', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
  { icon: <Layers size={22} />, title: 'Batch Generation', desc: 'Generate hundreds of videos from structured data and templates automatically.', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
  { icon: <Clock size={22} />, title: 'Timestamp Tools', desc: 'Auto-parse timestamps from scripts and audio to drive precise video cuts.', color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
  { icon: <Merge size={22} />, title: 'Audio Merger', desc: 'Combine multiple audio tracks into one clean output ready for export.', color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
  { icon: <Cpu size={22} />, title: 'Local Rendering', desc: 'All rendering happens on your machine. No cloud uploads. Fast and private.', color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' },
  { icon: <BookTemplate size={22} />, title: 'Reusable Templates', desc: 'Save and reuse video project templates across different content series instantly.', color: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/20' },
]

const workflow = [
  { step: '01', title: 'Import your assets', desc: 'Drag in audio files, images, scripts, and timestamp data.', color: 'from-blue-500 to-indigo-500' },
  { step: '02', title: 'Build your timeline', desc: 'Arrange assets on the visual timeline editor with millisecond precision.', color: 'from-indigo-500 to-violet-500' },
  { step: '03', title: 'Apply a template', desc: 'Use pre-built templates or create your own reusable workflows.', color: 'from-violet-500 to-fuchsia-500' },
  { step: '04', title: 'Batch & export', desc: 'Generate dozens of videos at once. Export at 720p, 1080p, 2K or 4K.', color: 'from-fuchsia-500 to-rose-500' },
]

const useCases = [
  { icon: <Users size={18} />, title: 'Content Creators', desc: 'Produce synced videos at scale for YouTube, social media, and podcasts.' },
  { icon: <FileText size={18} />, title: 'Script Producers', desc: 'Turn spoken scripts into timed visual presentations automatically.' },
  { icon: <Globe size={18} />, title: 'Agencies', desc: 'Automate client video deliverables with batch generation capabilities.' },
]

const trustPoints = [
  { icon: <Shield size={20} />, title: 'Local & Private', desc: 'Nothing leaves your machine. Rendering is 100% local.' },
  { icon: <Zap size={20} />, title: 'Mac & Windows', desc: 'Cross-platform desktop app. Native performance on both platforms.' },
  { icon: <Star size={20} />, title: 'Commercial Use Ready', desc: 'Exported videos are 100% yours to use anywhere.' },
]

const floatingElements = [
  { icon: <Film size={24} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', delay: 0, x: -120, y: -40 },
  { icon: <Merge size={24} />, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', delay: 0.2, x: 140, y: -20 },
  { icon: <Layers size={24} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', delay: 0.4, x: -80, y: 60 },
  { icon: <Clock size={24} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', delay: 0.6, x: 100, y: 80 },
]

function AnimatedVisual() {
  return (
    <div className="w-full max-w-5xl mx-auto mt-8 relative flex items-center justify-center perspective-[2000px]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] bg-gradient-to-br from-indigo-500/20 to-violet-600/20 rounded-full blur-[80px] pointer-events-none" />
      
      {/* 3D Container for Dashboard */}
      <motion.div
        initial={{ opacity: 0, rotateX: 10, y: 40 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ duration: 1, delay: 0.2, type: "spring", damping: 20 }}
        className="w-full relative z-10 glass-strong border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-3xl bg-surface-900/80"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Window Header */}
        <div className="h-12 border-b border-white/5 flex items-center px-4 md:px-6 bg-surface-850">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-600" />
            <div className="w-3 h-3 rounded-full bg-slate-600" />
            <div className="w-3 h-3 rounded-full bg-slate-600" />
          </div>
          <div className="mx-auto flex items-center gap-2">
            <Zap size={14} className="text-indigo-400" />
            <span className="text-xs font-medium text-slate-400">project_v2_final.sfs</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-auto md:h-[450px]">
          {/* Sidebar */}
          <div className="hidden md:flex w-48 border-r border-white/5 flex-col p-4 gap-2 bg-surface-850">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assets</div>
            {[Image, Film, Merge].map((Icon, i) => (
              <div key={i} className="h-10 rounded-lg flex items-center justify-start px-3 gap-3 hover:bg-surface-850 cursor-pointer transition-colors text-slate-400">
                <Icon size={16} />
                <div className="h-2 w-20 bg-slate-700/50 rounded-full" />
              </div>
            ))}
            <div className="mt-auto flex items-center gap-3 h-10 px-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
              <div className="h-2 w-16 bg-slate-700/50 rounded-full" />
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Preview Player */}
            <div className="flex-1 p-4 md:p-6 flex items-center justify-center relative min-h-[250px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="w-full max-w-sm aspect-video rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a24] to-[#0f0f16] shadow-2xl relative overflow-hidden group"
              >
                {/* Abstract video content */}
                <div className="absolute inset-0 opacity-50 bg-gradient-to-tr from-indigo-500/20 via-transparent to-violet-500/20" />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 1, 0]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full object-cover"
                >
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl" />
                  <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-violet-500/30 rounded-full blur-3xl" />
                </motion.div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-surface-800 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Play size={20} fill="white" className="text-white ml-1" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Timeline Area */}
            <div className="h-36 md:h-48 border-t border-white/5 bg-surface-950/50 p-4 relative">
              {/* Playhead */}
              <motion.div 
                initial={{ x: "0%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 bottom-0 left-[10%] w-px bg-indigo-500 z-20"
              >
                <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-indigo-500" />
                <div className="absolute top-0 bottom-0 -left-4 w-8 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent pointer-events-none" />
              </motion.div>

              <div className="flex flex-col gap-3 relative z-10 pl-4 md:pl-8 overflow-hidden h-full">
                {/* Video Track */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 text-slate-500"><Video size={14} /></div>
                  <div className="flex-1 flex gap-1 h-6">
                    <motion.div initial={{ width: 0 }} animate={{ width: '30%' }} transition={{ duration: 1, delay: 0.6 }} className="h-full rounded bg-indigo-500/20 border border-indigo-500/30" />
                    <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 1, delay: 0.8 }} className="h-full rounded bg-violet-500/20 border border-violet-500/30" />
                    <motion.div initial={{ width: 0 }} animate={{ width: '20%' }} transition={{ duration: 1, delay: 1.0 }} className="h-full rounded bg-indigo-500/20 border border-indigo-500/30" />
                  </div>
                </div>

                {/* Audio Track */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-4 h-4 text-slate-500"><Merge size={14} /></div>
                  <div className="flex-1 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center overflow-hidden px-1 gap-[2px]">
                    {/* Fake waveform */}
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: ['20%', `${40 + Math.random() * 60}%`, '20%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                        className="w-1.5 bg-blue-400/40 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating accent elements outside dashboard */}
      {floatingElements.map((el, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 + el.delay, type: "spring" }}
          className="absolute z-20 hidden lg:block"
          style={{ 
            left: `calc(50% + ${el.x * 3.5}px)`, 
            top: `calc(50% + ${el.y * 2.5}px)` 
          }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: el.delay }}
            className={`w-14 h-14 rounded-2xl glass-strong border ${el.border} ${el.bg} ${el.color} flex items-center justify-center shadow-2xl backdrop-blur-xl`}
          >
            {el.icon}
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-surface-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <Container className="relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium px-4 py-2 rounded-full shadow-lg shadow-indigo-500/10">
                <Zap size={14} fill="currentColor" />
                Local rendering · Mac & Windows · No cloud upload
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight max-w-4xl"
            >
              Desktop video automation{' '}
              <span className="gradient-text">for serious creators.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
            >
              Generate timeline-based videos, batch render projects, merge audio, and manage credits from one professional workspace. Built for editors, creators, and agencies.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full"
            >
              <Link to="/download" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
                <Play size={18} fill="white" />
                Download App
              </Link>
              <Link to="/pricing" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
                View Pricing
              </Link>
              <Link to="/login" className="btn-ghost text-base px-6 py-4 w-full sm:w-auto">
                Get Started →
              </Link>
            </motion.div>
          </div>
        </Container>

        {/* Animated Visual outside main text container but still inside section */}
        <motion.div
          className="w-full relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <AnimatedVisual />
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <Section
        badge="Core Features"
        title="Everything you need to create"
        subtitle="A comprehensive toolkit for timeline-based video creation and large-scale batch generation."
        className="bg-surface-925"
      >
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((item, i) => (
              <motion.div 
                key={item.title} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-6 md:p-8 rounded-3xl bg-surface-900 border border-white/5 hover:-translate-y-1 hover:border-white/10 transition-all duration-300 group cursor-default shadow-xl overflow-hidden"
              >
                {/* Top border highlight on hover */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Background glow on hover */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${item.color} rounded-full blur-[80px] opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none`} />
                
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg ${item.shadow}`}>
                    {item.icon}
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/features" className="btn-ghost text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-2">
              View all features <ChevronRight size={16} />
            </Link>
          </motion.div>
        </Container>
      </Section>

      {/* Workflow Steps */}
      <Section
        badge="How it works"
        title="Creator workflow"
        subtitle="From raw assets to polished export in four simple steps."
        className="relative"
      >
        {/* Subtle background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <Container>
          <div className="relative mt-8 lg:mt-16">
            {/* Desktop Connecting Line */}
            <div className="hidden lg:block absolute top-[47px] left-[12.5%] right-[12.5%] h-[2px] z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0" />
              <div className="absolute inset-0 overflow-hidden">
                <motion.div 
                  className="absolute top-0 bottom-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                  animate={{ left: ["-25%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-6 relative z-10">
              {workflow.map((step, i) => (
                <motion.div 
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* Step Node */}
                  <div className="w-24 h-24 mb-8 relative flex items-center justify-center shrink-0">
                    {/* Hover Glow Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-2xl`} />
                    
                    {/* Physical Card */}
                    <div className="relative w-full h-full bg-surface-900 border border-white/10 rounded-3xl flex items-center justify-center group-hover:-translate-y-2 group-hover:border-white/20 transition-all duration-300 shadow-xl overflow-hidden">
                      {/* Subtle internal gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/30 group-hover:from-white group-hover:to-white/80 transition-all duration-300">
                        {step.step}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-[220px]">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Use Cases */}
      <Section className="bg-surface-925">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-6 shadow-lg shadow-blue-500/10">Use Cases</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">Built for creators who work at scale</h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
              Whether you're a solo content creator, a production agency, or a studio, SyncFrame Studio adapts perfectly to your workflow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <motion.div 
                key={uc.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="p-8 rounded-3xl bg-surface-900 border border-white/5 hover:-translate-y-2 hover:border-indigo-500/30 transition-all duration-300 shadow-xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-400 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300">
                  {uc.icon}
                </div>
                <h4 className="text-white font-bold text-xl mb-3 group-hover:text-indigo-300 transition-colors">{uc.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Trust / Security */}
      <Section className="py-12 md:py-20">
        <Container>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-full bg-surface-900 border border-white/5 px-8 py-6 md:px-16 md:py-8 relative overflow-hidden group shadow-xl"
          >
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {trustPoints.map((tp, i) => (
                <div 
                  key={tp.title} 
                  className={`flex flex-col items-center text-center w-full ${i !== 0 ? 'pt-8 md:pt-0' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-surface-850 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    {tp.icon}
                  </div>
                  <h4 className="text-white font-bold mb-1">{tp.title}</h4>
                  <p className="text-slate-400 text-xs max-w-[200px] leading-relaxed">{tp.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* CTA Section */}
      <CTASection
        title="Start creating videos"
        titleHighlight="the professional way."
        description="Download SyncFrame Studio for free and get 30 trial credits. Mac and Windows. Local rendering. No cloud upload."
        primaryLabel="Download for Free"
        primaryTo="/download"
        secondaryLabel="View Pricing"
        secondaryTo="/pricing"
        badge="Free trial — 30 credits included"
      />
    </div>
  )
}

