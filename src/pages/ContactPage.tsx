import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageSquare, Building2, ChevronDown, ChevronUp, Send } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Container from '../components/layout/Container'
import Section from '../components/layout/Section'

const faqs = [
  {
    q: 'How do I reset my password?',
    a: 'You can reset your password from the login page by clicking "Forgot password". A reset link will be sent to your registered email address.',
  },
  {
    q: 'How do I get my credits back if a generation failed?',
    a: 'If a video generation fails due to an app error, credits are not consumed. If you believe credits were charged incorrectly, contact our support team.',
  },
  {
    q: 'How do I report a bug?',
    a: 'Use the contact form on this page and select "Bug Report" as the subject. Include your OS version, app version, and a description of the issue.',
  },
  {
    q: 'Can I use SyncFrame Studio offline?',
    a: 'Rendering is fully local and works offline. You need an internet connection only to log in and sync your plan and credits.',
  },
  {
    q: 'Is there a community forum or Discord?',
    a: 'A community channel is planned for launch. Sign up to the waitlist to get notified when it opens.',
  },
  {
    q: 'How long until I hear back from support?',
    a: 'We aim to respond to all support emails within 24–48 hours on business days.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className={`font-medium text-sm transition-colors ${open ? 'text-indigo-400' : 'text-white group-hover:text-indigo-300'}`}>{q}</span>
        <span className="flex-shrink-0 ml-4 text-slate-500 group-hover:text-slate-300 transition-colors">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-5">
              <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Frontend placeholder — no real email sending
    setSubmitted(true)
  }

  return (
    <div className="w-full flex flex-col">
      <PageHeader
        badge="Contact & Support"
        badgeVariant="blue"
        title="We're here to"
        titleHighlight="help."
        description="Have a question, bug report, or business inquiry? Reach out and we'll get back to you promptly."
      />

      <Section className="!pt-0">
        <Container className="max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

            {/* Contact Form */}
            <div className="w-full">
              <h2 className="text-2xl font-bold text-white mb-6">Send a message</h2>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-surface-900 border border-emerald-500/20 text-center flex flex-col items-center justify-center min-h-[400px] shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-5">
                    <Send size={24} />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Message sent!</h3>
                  <p className="text-slate-400 text-sm">We'll get back to you within 24–48 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8 rounded-2xl bg-surface-900 border border-white/5 shadow-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="w-full flex flex-col">
                      <label htmlFor="contact-name" className="block text-slate-400 text-sm font-medium mb-2">Name</label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all"
                      />
                    </div>
                    <div className="w-full flex flex-col">
                      <label htmlFor="contact-email" className="block text-slate-400 text-sm font-medium mb-2">Email</label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all"
                      />
                    </div>
                  </div>
                  <div className="w-full flex flex-col">
                    <label htmlFor="contact-subject" className="block text-slate-400 text-sm font-medium mb-2">Subject</label>
                    <select
                      id="contact-subject"
                      required
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all appearance-none"
                    >
                      <option value="" disabled className="bg-surface-950">Select a subject</option>
                      <option value="support" className="bg-surface-950">Technical Support</option>
                      <option value="bug" className="bg-surface-950">Bug Report</option>
                      <option value="billing" className="bg-surface-950">Billing Question</option>
                      <option value="business" className="bg-surface-950">Business Inquiry</option>
                      <option value="feature" className="bg-surface-950">Feature Request</option>
                      <option value="other" className="bg-surface-950">Other</option>
                    </select>
                  </div>
                  <div className="w-full flex flex-col">
                    <label htmlFor="contact-message" className="block text-slate-400 text-sm font-medium mb-2">Message</label>
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your question or issue..."
                      className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all resize-none"
                    />
                  </div>
                  <button id="contact-submit" type="submit" className="btn-primary w-full justify-center py-4">
                    <Send size={16} />
                    Send Message
                  </button>
                  <p className="text-slate-600 text-[11px] text-center pt-2">
                    This is a frontend placeholder. Real email sending will be enabled post-launch.
                  </p>
                </form>
              )}
            </div>

            {/* Support Info */}
            <div className="w-full space-y-5 lg:pt-14">
              <h2 className="text-2xl font-bold text-white mb-6">Other ways to reach us</h2>

              <div className="p-6 rounded-2xl bg-surface-900 border border-white/5 shadow-xl flex items-start gap-5 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div className="w-full flex flex-col pt-1">
                  <h3 className="text-white font-semibold mb-1">Support Email</h3>
                  <p className="text-slate-400 text-sm">support@syncframestudio.com</p>
                  <p className="text-slate-500 text-xs mt-1">Response time: 24–48 hours</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-surface-900 border border-white/5 shadow-xl flex items-start gap-5 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div className="w-full flex flex-col pt-1">
                  <h3 className="text-white font-semibold mb-1">Community (Coming Soon)</h3>
                  <p className="text-slate-400 text-sm">A Discord server and community forum are planned for launch.</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-surface-900 border border-white/5 shadow-xl flex items-start gap-5 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="w-full flex flex-col pt-1">
                  <h3 className="text-white font-semibold mb-1">Business Inquiries</h3>
                  <p className="text-slate-400 text-sm">hello@syncframestudio.com</p>
                  <p className="text-slate-500 text-xs mt-1">Partnerships, press, licensing, and enterprise</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section title="Frequently asked questions" className="bg-surface-925">
        <Container className="max-w-3xl">
          <div className="bg-surface-900 shadow-xl rounded-2xl border border-white/5 px-6 md:px-8 py-2">
            {faqs.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </Container>
      </Section>
    </div>
  )
}
