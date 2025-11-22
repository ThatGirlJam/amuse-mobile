import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

/**
 * GET /api/auth/reset-password/callback
 * Handle password reset callback from email link
 * Supabase sends tokens in the URL hash, which we need to exchange for a session
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') || '/reset-password'

    if (!token_hash || type !== 'recovery') {
      return NextResponse.redirect(new URL('/login?error=invalid_reset_link', request.url))
    }

    const supabase = createServerClient()

    // Exchange the token for a session
    // Note: Supabase sends tokens in the URL hash, but we need to handle them
    // The actual token is usually in the hash fragment, not query params
    // We'll need to handle this on the client side or use a different approach
    
    // For now, redirect to reset-password page with the token
    // The client-side will need to extract it from the hash
    return NextResponse.redirect(new URL(`${next}?token_hash=${token_hash}&type=${type}`, request.url))
  } catch (error) {
    return NextResponse.redirect(new URL('/login?error=reset_failed', request.url))
  }
}

