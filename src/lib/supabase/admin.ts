import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

// Bypasses RLS. Only for server code that genuinely needs it (e.g. global stats).
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(env.supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
