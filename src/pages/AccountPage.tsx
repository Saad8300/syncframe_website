import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Eye, EyeOff, User, Coins, Zap, CreditCard, LogIn, Globe, Shield, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Container from '../components/layout/Container'
import Section from '../components/layout/Section'

type AuthMode = 'login' | 'signup'

export default function AccountPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder — no real Supabase auth yet
    alert('Auth integration coming soon. This is a UI placeholder for future Supabase integration.')
  }

  return (
    <div className="w-full flex flex-col">
      <PageHeader
        badge="Account"
        badgeVariant="indigo"
        title={mode === 'login' ? 'Welcome back.' : 'Create your account.'}
        description={
          mode === 'login'
            ? 'Log in to sync your plan, credits, and tool access with the desktop app.'
            : 'Create a free account to get started with SyncFrame Studio.'
        }
      />

      <Section className="!pt-0">
        <Container className="max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            
            {/* Auth Form */}
            <div className="w-full max-w-md mx-auto">
              <div className="glass-strong rounded-3xl border border-white/8 p-6 md:p-8">
                {/* Tab Toggle */}
                <div className="flex bg-black/20 rounded-xl p-1.5 mb-8">
                  {(['login', 'signup'] as AuthMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                        mode === m
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {m === 'login' ? 'Log In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                {/* Google OAuth Button (Placeholder) */}
                <button
                  type="button"
                  onClick={() => alert('Google OAuth integration coming soon.')}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl glass border border-white/10 text-white text-sm font-medium hover:border-indigo-500/30 hover:bg-surface-850 transition-all mb-6"
                >
                  <Globe size={18} className="text-blue-400" />
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-surface-850" />
                  <span className="text-slate-500 text-xs font-medium">OR CONTINUE WITH EMAIL</span>
                  <div className="flex-1 h-px bg-surface-850" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="w-full flex flex-col">
                      <label htmlFor="auth-name" className="block text-slate-400 text-sm font-medium mb-2">Full Name</label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          id="auth-name"
                          type="text"
                          required={mode === 'signup'}
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="w-full flex flex-col">
                    <label htmlFor="auth-email" className="block text-slate-400 text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="auth-email"
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="w-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="auth-password" className="text-slate-400 text-sm font-medium">Password</label>
                      {mode === 'login' && (
                        <button type="button" className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors">
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <LogIn size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center py-3.5 mt-2">
                    {mode === 'login' ? 'Log In' : 'Create Account'}
                  </button>
                </form>

                {/* Supabase Note */}
                <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
                  <Info size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This is a UI foundation ready for Supabase authentication. Real login will be enabled at launch.
                  </p>
                </div>
              </div>
            </div>

            {/* Account Status Placeholder */}
            <div className="w-full space-y-4 lg:pt-8">
              <h2 className="text-xl font-bold text-white mb-6">Account overview</h2>

              {/* Account Card */}
              <div className="p-6 rounded-2xl glass border border-white/8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="w-full flex flex-col">
                    <div className="h-4 w-32 bg-white/8 rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-surface-850 rounded animate-pulse" />
                  </div>
                </div>
                <p className="text-slate-500 text-xs">Log in to see your account details</p>
              </div>

              {/* Plan Card */}
              <div className="p-6 rounded-2xl glass border border-white/8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-indigo-400" />
                  <span className="text-white font-semibold text-sm">Current Plan</span>
                </div>
                <div className="h-8 w-24 bg-surface-850 rounded-lg animate-pulse mb-3" />
                <p className="text-slate-500 text-xs">Plan information loads after login</p>
              </div>

              {/* Credits Card */}
              <div className="p-6 rounded-2xl glass border border-white/8">
                <div className="flex items-center gap-2 mb-4">
                  <Coins size={16} className="text-amber-400" />
                  <span className="text-white font-semibold text-sm">Credits Remaining</span>
                </div>
                <div className="h-8 w-20 bg-surface-850 rounded-lg animate-pulse mb-3" />
                <div className="w-full bg-surface-850 rounded-full h-2.5 mb-3 overflow-hidden">
                  <div className="bg-indigo-500/40 h-full rounded-full w-1/3" />
                </div>
                <p className="text-slate-500 text-xs">Credit balance loads after login</p>
              </div>

              {/* Subscription Card */}
              <div className="p-6 rounded-2xl glass border border-white/8">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={16} className="text-violet-400" />
                  <span className="text-white font-semibold text-sm">Manage Subscription</span>
                </div>
                <p className="text-slate-400 text-sm mb-5 leading-relaxed">Upgrade, downgrade, or cancel your plan from your account dashboard.</p>
                <Link to="/pricing" className="btn-secondary text-sm py-2.5 px-5 inline-flex items-center gap-2">
                  View Plans
                </Link>
              </div>

              {/* Security Note */}
              <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3 mt-4">
                <Shield size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your login is secured with Supabase Auth. Passwords are never stored in plain text. We never access your video content.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}
