import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { getUserById } from '@/lib/db/users'

/**
 * GET /api/auth/session
 * Get the current user session
 */
export async function GET(request) {
  try {
    const supabase = createServerClient()
    const cookieStore = await cookies()

    // Get access token from cookies
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { user: null, session: null },
        { status: 200 }
      )
    }

    // Set the session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !authUser) {
      // Clear invalid tokens
      cookieStore.delete('sb-access-token')
      cookieStore.delete('sb-refresh-token')
      return NextResponse.json(
        { user: null, session: null },
        { status: 200 }
      )
    }

    // Get user data from users table
    const { data: userData } = await getUserById(authUser.id)

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        email_verified: authUser.email_confirmed_at !== null,
        full_name: userData?.full_name || null,
        mobile_number: userData?.mobile_number || null,
        date_of_birth: userData?.date_of_birth || null,
        profile_picture_url: userData?.profile_picture_url || null,
        created_at: authUser.created_at
      },
      session: {
        expires_at: authUser.last_sign_in_at
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

