import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createUser } from '@/lib/db/users'

/**
 * POST /api/auth/signup
 * Register a new user with Supabase Auth and create user record
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, full_name, mobile_number, date_of_birth } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength (optional - add more rules as needed)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || null,
          mobile_number: mobile_number || null,
          date_of_birth: date_of_birth || null
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create user record in users table
    const { data: userData, error: userError } = await createUser({
      id: authData.user.id, // Use the auth user ID
      email: authData.user.email,
      password_hash: '', // Password is handled by Supabase Auth
      full_name: full_name || null,
      mobile_number: mobile_number || null,
      date_of_birth: date_of_birth || null
    })

    if (userError) {
      // If user creation fails, we should ideally rollback the auth user
      // For now, just log the error
      console.error('Failed to create user record:', userError)
      // Note: In production, you might want to delete the auth user here
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: userData?.full_name || null
      },
      session: authData.session,
      message: 'User created successfully. Please check your email to verify your account.'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

