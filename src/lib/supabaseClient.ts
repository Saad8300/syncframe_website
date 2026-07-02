// src/lib/supabaseClient.ts
// Supabase client for SyncFrame website — uses same project as desktop app.
// Only uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (never service role key).

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSupabaseConfigured(): boolean {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 20
  )
}

export let supabase: SupabaseClient | null = null

if (isSupabaseConfigured()) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
