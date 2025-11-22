import { NextResponse } from 'next/server'
import { getUserById } from '@/lib/db/users'
import { getTutorialById } from '@/lib/db/tutorials'
import { upsertUserTutorialInteraction, getUserTutorialInteraction } from '@/lib/db/user-tutorial-interactions'

/**
 * POST /api/users/{user_id}/tutorials/{tutorial_id}/interactions
 * Updates saved/liked/view state. Writes to the UserTutorialInteractions table.
 */
export async function POST(request, { params }) {
  try {
    const { user_id, tutorial_id } = await params
    const body = await request.json()
    const { is_saved, is_liked, increment_view, matched_features } = body

    // Verify user exists
    const { data: user, error: userError } = await getUserById(user_id)
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify tutorial exists
    const { data: tutorial, error: tutorialError } = await getTutorialById(tutorial_id)
    if (tutorialError || !tutorial) {
      return NextResponse.json(
        { error: 'Tutorial not found' },
        { status: 404 }
      )
    }

    // Get existing interaction to preserve current state
    const { data: existing } = await getUserTutorialInteraction(user_id, tutorial_id)

    // Prepare update data
    const updateData = {
      user_id,
      tutorial_id,
      matched_features: matched_features || existing?.matched_features || null
    }

    // Handle boolean flags - only update if explicitly provided
    if (typeof is_saved === 'boolean') {
      updateData.is_saved = is_saved
    } else if (existing) {
      updateData.is_saved = existing.is_saved
    } else {
      updateData.is_saved = false
    }

    if (typeof is_liked === 'boolean') {
      updateData.is_liked = is_liked
    } else if (existing) {
      updateData.is_liked = existing.is_liked
    } else {
      updateData.is_liked = false
    }

    // Handle view count increment
    if (increment_view === true) {
      updateData.view_count = (existing?.view_count || 0) + 1
    } else if (existing) {
      updateData.view_count = existing.view_count || 0
    } else {
      updateData.view_count = 0
    }

    // Upsert the interaction
    const { data: interaction, error: interactionError } = await upsertUserTutorialInteraction(updateData)

    if (interactionError) {
      return NextResponse.json(
        { error: 'Failed to update interaction', details: interactionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user_id: interaction.user_id,
      tutorial_id: interaction.tutorial_id,
      is_saved: interaction.is_saved,
      is_liked: interaction.is_liked,
      view_count: interaction.view_count,
      matched_features: interaction.matched_features
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

