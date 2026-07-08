import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Unauthorized: missing authorization header')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
     throw new Error('Server misconfiguration: missing Supabase URL or keys')
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(jwt);
  if (userError || !user) {
    throw new Error(`Unauthorized: invalid authentication token. Details: ${userError?.message || 'No user'}`)
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: adminCheck, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (adminError || !adminCheck) {
    throw new Error('Unauthorized: admin privileges required')
  }

  return { user, supabaseAdmin, supabaseUrl }
}
