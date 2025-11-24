import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { getUserById } from '@/lib/db/users'
import { createUser } from '@/lib/db/users'

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 * This endpoint processes the OAuth callback and creates/updates user record
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/'
    const isSignup = searchParams.get('signup') === 'true'

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
    }

    const supabase = createServerClient()

    // Exchange code for session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (authError || !authData.session) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }

    // Check if user record exists, if not create it
    const { data: existingUser } = await getUserById(authData.user.id)
    const isNewUser = !existingUser
    
    if (isNewUser) {
      // Create user record
      await createUser({
        id: authData.user.id,
        email: authData.user.email,
        password_hash: '', // OAuth users don't have passwords
        full_name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || null,
        mobile_number: authData.user.user_metadata?.mobile_number || null,
        date_of_birth: authData.user.user_metadata?.date_of_birth || null
      })
    }

    // Set session cookies
    const cookieStore = await cookies()
    cookieStore.set('sb-access-token', authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: authData.session.expires_in
    })
    cookieStore.set('sb-refresh-token', authData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Redirect new users from signup to onboarding
    if (isSignup && isNewUser) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    return NextResponse.redirect(new URL(next, request.url))
  } catch (error) {
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}

