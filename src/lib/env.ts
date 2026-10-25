// NEXT_PUBLIC_* vars must be referenced literally so Next can inline them in the browser bundle.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl?.startsWith('http') || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill it in.'
  )
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  // Server only, optional: the Google Search Console HTML-tag token, to verify domain ownership.
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION,
}
