import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

// createBrowserClient returns a singleton in the browser, so calling this per render is cheap.
export const createClient = () =>
  createBrowserClient(env.supabaseUrl, env.supabaseAnonKey)
