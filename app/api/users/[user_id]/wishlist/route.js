import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { getUserById } from '@/lib/db/users'
import { getUserInteractionsWithTutorials } from '@/lib/db/user-tutorial-interactions'

/**
 * GET /api/users/{user_id}/wishlist
 * Get all saved tutorials (wishlist) for a user
 */
export async function GET(request, { params }) {
  try {
    const { user_id } = await params

    // Verify authentication
    const supabase = createServerClient()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // Verify user session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid session. Please sign in again.' },
        { status: 401 }
      )
    }

    // Verify the user_id matches the authenticated user
    if (authUser.id !== user_id) {
      return NextResponse.json(
        { error: 'Forbidden. You can only access your own wishlist.' },
        { status: 403 }
      )
    }

    // Verify user exists
    const { data: user, error: userError } = await getUserById(user_id)
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get saved tutorials
    const { data: interactions, error: interactionsError } = await getUserInteractionsWithTutorials(user_id, {
      savedOnly: true
    })

    if (interactionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch wishlist', details: interactionsError.message },
        { status: 500 }
      )
    }

    // Transform the data to match the expected response format
    const tutorials = (interactions || []).map(interaction => {
      const tutorial = interaction.tutorials
      return {
        tutorial_id: tutorial.id,
        title: tutorial.title,
        url: tutorial.url,
        channel: tutorial.channel,
        score: tutorial.score,
        query: tutorial.query,
        matched_features: tutorial.matched_features,
        is_saved: true,
        is_liked: interaction.is_liked || false,
        view_count: interaction.view_count || 0,
        saved_at: interaction.updated_at || interaction.created_at
      }
    })

    // Sort by saved_at (most recently saved first)
    tutorials.sort((a, b) => {
      const dateA = new Date(a.saved_at || 0)
      const dateB = new Date(b.saved_at || 0)
      return dateB - dateA
    })

    return NextResponse.json({
      tutorials
    })
  } catch (error) {
    console.error('Error in wishlist GET:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

