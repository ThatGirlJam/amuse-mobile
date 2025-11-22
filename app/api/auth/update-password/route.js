import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/update-password
 * Update user password
 * Can work with either:
 * 1. A valid session (for logged-in users changing password)
 * 2. A password reset token (for users resetting password via email link)
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { new_password, token_hash } = body

    if (!new_password) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const cookieStore = await cookies()

    // Try to get session from cookies first (for logged-in users)
    let accessToken = cookieStore.get('sb-access-token')?.value
    let user = null

    if (accessToken) {
      // Verify the user from session
      const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
      if (!userError && userData?.user) {
        user = userData.user
      }
    }

    // If no valid session, check if this is a password reset scenario
    // For password reset, the client should have already exchanged the token for a session
    // and set the cookies. If not, we need to tell them to use the client-side method.
    if (!user) {
      return NextResponse.json(
        { error: 'Auth session missing! Please use the password reset link from your email. If you clicked the link, make sure you complete the reset on the same page.' },
        { status: 401 }
      )
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Password updated successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

