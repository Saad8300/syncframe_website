// src/contexts/AuthContext.tsx
// Auth context for SyncFrame website using Supabase Auth (email/password).
// Provides: user, session, sign-in, sign-up, sign-out, loading, and error state.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export interface AuthUser {
  id: string
  email: string | null
  name: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  isConfigured: boolean
  error: string | null
  clearError: () => void
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ confirmEmail: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

function mapUser(user: User): AuthUser {
  const meta = user.user_metadata || {}
  return {
    id: user.id,
    email: user.email ?? null,
    name: meta.full_name || meta.name || null,
  }
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  isConfigured: false,
  error: null,
  clearError: () => {},
  signInWithPassword: async () => {},
  signUp: async () => ({ confirmEmail: false }),
  signOut: async () => {},
  resetPassword: async () => {},
})

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!configured || !supabase) {
      setLoading(false)
      return
    }

    // Load existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ? mapUser(session.user) : null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ? mapUser(session.user) : null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [configured])

  const clearError = useCallback(() => setError(null), [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Auth is not configured.')
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Auth is not configured.')
    setError(null)
    const { data, error: err } = await supabase.auth.signUp({ email, password })
    if (err) {
      setError(err.message)
      throw err
    }
    // If session is null after signup, email confirmation is required
    return { confirmEmail: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) { setSession(null); setUser(null); return }
    const { error: err } = await supabase.auth.signOut()
    if (err) setError(err.message)
    else { setSession(null); setUser(null) }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Auth is not configured.')
    setError(null)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (err) { setError(err.message); throw err }
  }, [])

  const isAuthenticated = session !== null && user !== null

  return (
    <AuthContext.Provider value={{
      user, session, loading, isAuthenticated, isConfigured: configured,
      error, clearError, signInWithPassword, signUp, signOut, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
