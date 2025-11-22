import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Support both variable names
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

// Lazy initialization - only create client when actually used
let _supabaseClient = null

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = 
      'Missing Supabase environment variables.\n\n' +
      'Please create a .env.local file in the root directory with:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=https://felejuwmpqwocqerhcnn.supabase.co\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here\n\n' +
      'You can find your Supabase anon key in your Supabase project settings under API.'
    
    throw new Error(errorMessage)
  }
  
  if (!_supabaseClient) {
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  
  return _supabaseClient
}

// Export supabase as a Proxy to lazy-load the client
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient()
    const value = client[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

