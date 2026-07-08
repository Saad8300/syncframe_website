import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Eye, EyeOff, Lock, User, ArrowRight, AlertCircle, CheckCircle2, Zap, Phone } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Container from '../components/layout/Container'
import SyncFrameLogo from '../components/SyncFrameLogo'

type Mode = 'login' | 'signup' | 'reset'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInWithPassword, signUp, resetPassword, isAuthenticated, loading, error, clearError } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const from = (location.state as any)?.from || '/dashboard'

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, from])

  const handleModeChange = (m: Mode) => {
    setMode(m)
    setFormError(null)
    setSuccessMsg(null)
    clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMsg(null)

    if (!email.trim()) { setFormError('Email is required.'); return }

    if (mode === 'signup') {
      const name = fullName.trim()
      if (!name || name.length < 2 || name.length > 100) { setFormError('Full Name must be between 2 and 100 characters.'); return }

      const trimmedPhone = phoneNumber.trim()

      if (/[^0-9+\s\-()]/g.test(trimmedPhone)) {
        setFormError('Phone number contains invalid characters.')
        return
      }
      if ((trimmedPhone.match(/\+/g) || []).length > 1) {
        setFormError('Phone number can only contain one + sign.')
        return
      }
      if (trimmedPhone.includes('+') && !trimmedPhone.startsWith('+')) {
        setFormError('The + sign must be at the beginning of the phone number.')
        return
      }

      const hasPlus = trimmedPhone.startsWith('+')
      const digitsOnly = trimmedPhone.replace(/\D/g, '')
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        setFormError('Please enter a valid phone number (7-15 digits).')
        return
      }
      const normalizedPhone = hasPlus ? `+${digitsOnly}` : digitsOnly

      if (!password) { setFormError('Password is required.'); return }
      if (password.length < 8) { setFormError('Password must be at least 8 characters.'); return }
      if (password !== confirmPassword) { setFormError('Passwords do not match.'); return }
    } else if (mode !== 'reset') {
      if (!password) { setFormError('Password is required.'); return }
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signInWithPassword(email, password)
        navigate(from, { replace: true })
      } else if (mode === 'signup') {
        const trimmedPhone = phoneNumber.trim()
        const hasPlus = trimmedPhone.startsWith('+')
        const digitsOnly = trimmedPhone.replace(/\D/g, '')
        const normalizedPhone = hasPlus ? `+${digitsOnly}` : digitsOnly

        const metadata = {
          full_name: fullName.trim(),
          phone_number: normalizedPhone,
          marketing_opt_in: marketingConsent
        }
        const { confirmEmail } = await signUp(email, password, metadata)
        if (confirmEmail) {
          setSuccessMsg('Account created! Check your email to confirm your address, then log in.')
          setMode('login')
        } else {
          navigate('/dashboard', { replace: true })
        }
      } else {
        await resetPassword(email)
        setSuccessMsg('Password reset email sent. Check your inbox.')
      }
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const displayError = formError || error

  return (
    <div className="w-full min-h-screen flex items-center justify-center py-20 px-4 relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/8 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <Container className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <SyncFrameLogo size="lg" linkTo="/" subtitle="STUDIO" />
          </div>

          <div className="glass-strong rounded-3xl border border-white/8 p-8">
            {/* Mode Tabs */}
            {mode !== 'reset' && (
              <div className="flex bg-black/20 rounded-xl p-1.5 mb-8">
                {(['login', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModeChange(m)}
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
            )}

            {mode === 'reset' && (
              <div className="mb-8">
                <h2 className="text-white font-bold text-xl mb-1">Reset password</h2>
                <p className="text-slate-400 text-sm">Enter your email to receive a reset link.</p>
              </div>
            )}

            {/* Success message */}
            {successMsg && (
              <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-300 text-sm leading-relaxed">{successMsg}</p>
              </div>
            )}

            {/* Error message */}
            {displayError && !successMsg && (
              <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm leading-relaxed">{displayError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              {mode === 'signup' && (
                <div>
                  <label htmlFor="login-fullname" className="block text-slate-400 text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="login-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/30 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-slate-400 text-sm font-medium mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/30 transition-all"
                  />
                </div>
              </div>

              {/* Phone Number */}
              {mode === 'signup' && (
                <div>
                  <label htmlFor="login-phone" className="block text-slate-400 text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="login-phone"
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/30 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="login-password" className="text-slate-400 text-sm font-medium">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => handleModeChange('reset')}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className="text-slate-500 text-xs mt-2">Must be at least 8 characters.</p>
                  )}
                </div>
              )}

              {/* Confirm Password */}
              {mode === 'signup' && (
                <div>
                  <label htmlFor="login-confirm-password" className="block text-slate-400 text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="login-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/30 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Marketing Consent */}
              {mode === 'signup' && (
                <div className="flex items-start gap-3 mt-2 pt-2">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="marketing-consent"
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={e => setMarketingConsent(e.target.checked)}
                      className="w-4 h-4 rounded border border-white/20 bg-black/20 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-0 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="marketing-consent" className="text-slate-400 cursor-pointer select-none leading-relaxed inline-block">
                      I agree to receive product updates, feature announcements, special offers, and marketing emails from SyncFrame Studio.
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center py-4 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {mode === 'login' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === 'login' && <><User size={16} /> Log In</>}
                    {mode === 'signup' && <><ArrowRight size={16} /> Create Account</>}
                    {mode === 'reset' && <><Mail size={16} /> Send Reset Link</>}
                  </span>
                )}
              </button>
            </form>

            {/* Back to login from reset */}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="mt-4 w-full text-center text-slate-400 hover:text-white text-sm transition-colors"
              >
                ← Back to login
              </button>
            )}

            {/* Divider + Download CTA */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-slate-500 text-xs text-center">
                Don't have the desktop app yet?{' '}
                <Link to="/download" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                  Download SyncFrame Studio →
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  )
}
