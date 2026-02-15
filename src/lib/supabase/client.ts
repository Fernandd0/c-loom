import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const createClient = () => {
  if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseKey) {
    return null
  }
  return createBrowserClient(supabaseUrl, supabaseKey)
}
