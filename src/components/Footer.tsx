import { Link } from 'react-router-dom'
import { X, Code, Mail } from 'lucide-react'
import Container from './layout/Container'
import SyncFrameLogo from './SyncFrameLogo'

const productLinks = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Download', to: '/download' },
  { label: 'Changelog', to: '/changelog' },
]

const resourceLinks = [
  { label: 'Documentation', to: '#' },
  { label: 'Tutorials', to: '#' },
  { label: 'Blog', to: '#' },
  { label: 'Status', to: '#' },
  { label: 'Support', to: '/contact' },
]

const legalLinks = [
  { label: 'Privacy Policy', to: '#' },
  { label: 'Terms of Service', to: '#' },
  { label: 'Cookie Policy', to: '#' },
  { label: 'Refund Policy', to: '#' },
]

export default function Footer() {
  return (
    <footer className="relative bg-surface-950 pt-16 pb-8 overflow-hidden">
      {/* Top glowing separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 bg-indigo-500/10 blur-[80px] pointer-events-none" />
      
      <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />
      <Container className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <SyncFrameLogo size="md" subtitle="STUDIO" className="mb-4 w-max" />
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              A powerful desktop studio for creating perfectly synced videos from audio, images, timestamps, and batch workflows.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <a
                href="#"
                aria-label="Twitter"
                className="w-10 h-10 rounded-xl bg-surface-850 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:-translate-y-1 transition-all duration-300"
              >
                <X size={16} />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="w-10 h-10 rounded-xl bg-surface-850 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:-translate-y-1 transition-all duration-300"
              >
                <Code size={16} />
              </a>
              <a
                href="mailto:hello@syncframestudio.com"
                aria-label="Email"
                className="w-10 h-10 rounded-xl bg-surface-850 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:-translate-y-1 transition-all duration-300"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-[0.15em] mb-6">Product</h4>
            <ul className="space-y-4">
              {productLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-slate-400 hover:text-white text-sm transition-all duration-300 hover:translate-x-1 inline-block">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-[0.15em] mb-6">Resources</h4>
            <ul className="space-y-4">
              {resourceLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-slate-400 hover:text-white text-sm transition-all duration-300 hover:translate-x-1 inline-block">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-[0.15em] mb-6">Legal</h4>
            <ul className="space-y-4">
              {legalLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-slate-400 hover:text-white text-sm transition-all duration-300 hover:translate-x-1 inline-block">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} SyncFrame Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-500 text-xs font-medium">All systems operational</span>
          </div>
        </div>
      </Container>
    </footer>
  )
}
