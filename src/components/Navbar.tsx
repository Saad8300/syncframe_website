import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap, LayoutDashboard, LogOut, ChevronDown, Shield, Sun, Moon } from 'lucide-react'
import Container from './layout/Container'
import SyncFrameLogo from './SyncFrameLogo'
import { useAuth } from '../contexts/AuthContext'

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Download', to: '/download' },
  { label: 'Changelog', to: '/changelog' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading, signOut } = useAuth()

  // Optional: Check admin status
  useEffect(() => {
    if (user?.id) {
      import('../lib/supabaseClient').then(({ supabase }) => {
        if (!supabase) return
        supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
          .then(({ data }) => setIsAdmin(!!data))
      })
    } else {
      setIsAdmin(false)
    }
  }, [user?.id])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setUserMenuOpen(false)
  }

  const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase()

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled || mobileOpen
            ? 'bg-surface-950/90 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <Container>
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <SyncFrameLogo size="md" subtitle="STUDIO" />

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center justify-center flex-1 mx-8 gap-1">
              {publicLinks.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      isActive
                        ? 'text-white bg-surface-850 border-white/5'
                        : 'text-slate-400 border-transparent hover:text-white hover:bg-surface-850'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center justify-end gap-3 flex-shrink-0">

              {loading ? (
                <div className="w-8 h-8 rounded-full bg-surface-850 animate-pulse" />
              ) : isAuthenticated ? (
                // User menu redesigned
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-surface-850 border border-transparent hover:border-white/10 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {initials}
                    </div>
                    <span className="text-slate-200 text-sm font-medium max-w-[120px] truncate">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                    <ChevronDown size={14} className={`text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-surface-900 rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/5">
                          <p className="text-white text-sm font-medium truncate">{user?.name || user?.email?.split('@')[0]}</p>
                          <p className="text-slate-400 text-xs truncate mt-0.5">{user?.email}</p>
                        </div>
                        <div className="p-1.5">
                          <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-surface-850 text-sm transition-colors">
                            <LayoutDashboard size={16} className="text-indigo-400" /> Dashboard
                          </Link>
                          <Link to="/upgrade" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-surface-850 text-sm transition-colors">
                            <Zap size={16} className="text-amber-400" /> Upgrade Plan
                          </Link>
                          {isAdmin && (
                            <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-surface-850 text-sm transition-colors">
                              <Shield size={16} className="text-violet-400" /> Admin Panel
                            </Link>
                          )}
                          <div className="h-px bg-surface-850 my-1.5" />
                          <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/5 text-sm transition-colors">
                            <LogOut size={16} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost text-slate-300 hover:text-white hover:bg-surface-850 text-sm py-2 px-4">
                    Log In
                  </Link>
                  <Link to="/download" className="btn-primary text-sm py-2 px-5">
                    Download App
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                className="p-2 -mr-2 rounded-lg text-slate-400 hover:bg-surface-850 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[72px] bottom-0 z-[90] bg-surface-950/95 backdrop-blur-xl md:hidden overflow-y-auto"
          >
            <Container className="pt-6 pb-24">
              <nav className="flex flex-col gap-2">
                {publicLinks.map(({ label, to }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `px-4 py-3.5 rounded-xl text-base font-medium transition-colors border ${
                        isActive
                          ? 'text-white bg-surface-850 border-white/5'
                          : 'text-slate-400 border-transparent hover:text-white hover:bg-surface-850'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}

                <div className="h-px bg-surface-850 my-4" />

                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2">
                      <p className="text-slate-500 text-xs">Signed in as</p>
                      <p className="text-slate-300 text-sm truncate">{user?.email}</p>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-slate-300 hover:bg-surface-850 text-base font-medium">
                      <LayoutDashboard size={16} className="text-indigo-400" /> Dashboard
                    </Link>
                    <Link to="/upgrade" className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-slate-300 hover:bg-surface-850 text-base font-medium">
                      <Zap size={16} className="text-amber-400" /> Upgrade Plan
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-slate-300 hover:bg-surface-850 text-base font-medium">
                        <Shield size={16} className="text-violet-400" /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleSignOut} className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-red-400 text-base font-medium w-full hover:bg-red-500/10">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary w-full justify-center py-4 text-base text-white bg-surface-850 hover:bg-surface-800 border border-white/10">
                      Log In
                    </Link>
                    <Link to="/download" className="btn-primary w-full justify-center py-4 text-base mt-2">
                      Download App
                    </Link>
                  </>
                )}
              </nav>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
