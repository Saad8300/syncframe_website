import { Link } from 'react-router-dom'
import { Zap, X, Code, Mail } from 'lucide-react'

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
    <footer className="relative border-t border-white/5 bg-[#05050a]">
      <div className="absolute inset-0 mesh-bg opacity-50 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap size={18} className="text-white" fill="white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-white text-base tracking-tight">SyncFrame</span>
                <span className="text-[10px] text-indigo-400 font-medium tracking-widest uppercase">Studio</span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              A powerful desktop studio for creating perfectly synced videos from audio, images, timestamps, and batch workflows.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="#"
                aria-label="Twitter"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
              >
                <X size={16} />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
              >
                <Code size={16} />
              </a>
              <a
                href="mailto:hello@syncframestudio.com"
                aria-label="Email"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Product</h4>
            <ul className="space-y-3">
              {productLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Resources</h4>
            <ul className="space-y-3">
              {resourceLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} SyncFrame Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-500 text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
