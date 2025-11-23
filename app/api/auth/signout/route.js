import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/signout
 * Sign out the current user
 */
export async function POST(request) {
  try {
    const supabase = createServerClient()
    const cookieStore = await cookies()

    // Get the current session
    const accessToken = cookieStore.get('sb-access-token')?.value
    const refreshToken = cookieStore.get('sb-refresh-token')?.value

    if (accessToken || refreshToken) {
      // Sign out with Supabase
      await supabase.auth.signOut()
    }

    // Clear cookies
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')

    return NextResponse.json({
      message: 'Signed out successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

