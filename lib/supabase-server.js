import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for API routes
 * This client is used for server-side operations and can handle cookies
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Support both variable names
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = []
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseAnonKey) {
      missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)')
    }
    
    throw new Error(
      `Missing Supabase environment variables: ${missing.join(', ')}\n\n` +
      'Please ensure your .env.local file in the project root contains:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=https://felejuwmpqwocqerhcnn.supabase.co\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here\n\n' +
      'After updating .env.local, restart your Next.js dev server.'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

