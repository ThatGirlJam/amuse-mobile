import { NextResponse } from 'next/server'
import { getUserById } from '@/lib/db/users'
import { getUserInteractionsWithTutorials } from '@/lib/db/user-tutorial-interactions'
import { getFeatureAnalysisByUserId } from '@/lib/db/feature-analysis'
import { getTutorialsByFeatures } from '@/lib/db/tutorials'

/**
 * GET /api/users/{user_id}/tutorials
 * Fetch all tutorials personalized for the user, based on:
 * - saved
 * - liked
 * - view count sorting
 * - matched features
 */
export async function GET(request, { params }) {
  try {
    const { user_id } = await params
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // "saved", "liked", or "all"

    // Verify user exists
    const { data: user, error: userError } = await getUserById(user_id)
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate filter
    if (!['saved', 'liked', 'all'].includes(filter)) {
      return NextResponse.json(
        { error: 'Invalid filter. Must be "saved", "liked", or "all"' },
        { status: 400 }
      )
    }

    // Get user's feature analysis to match features
    const { data: featureAnalysis } = await getFeatureAnalysisByUserId(user_id)
    const features = featureAnalysis ? {
      eye_shape: featureAnalysis.eye_shape,
      nose: featureAnalysis.nose,
      lips: featureAnalysis.lips
    } : null

    // Get interactions with tutorials based on filter
    const options = {
      savedOnly: filter === 'saved',
      likedOnly: filter === 'liked'
    }

    const { data: interactions, error: interactionsError } = await getUserInteractionsWithTutorials(
      user_id,
      options
    )

    if (interactionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch interactions', details: interactionsError.message },
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
        is_liked: interaction.is_liked || false,
        is_saved: interaction.is_saved || false,
        view_count: interaction.view_count || 0
      }
    })

    // Sort by view count (descending), then by score (descending)
    tutorials.sort((a, b) => {
      if (b.view_count !== a.view_count) {
        return b.view_count - a.view_count
      }
      return (b.score || 0) - (a.score || 0)
    })

    // If filter is "all" and we have features, also include tutorials matched by features
    if (filter === 'all' && features) {
      const { data: featureMatchedTutorials } = await getTutorialsByFeatures(features, { limit: 50 })
      
      if (featureMatchedTutorials) {
        // Add tutorials that aren't already in the list
        const existingIds = new Set(tutorials.map(t => t.tutorial_id))
        const newTutorials = featureMatchedTutorials
          .filter(t => !existingIds.has(t.id))
          .map(tutorial => ({
            tutorial_id: tutorial.id,
            title: tutorial.title,
            url: tutorial.url,
            channel: tutorial.channel,
            score: tutorial.score,
            query: tutorial.query,
            matched_features: tutorial.matched_features,
            is_liked: false,
            is_saved: false,
            view_count: 0
          }))
        
        tutorials.push(...newTutorials)
      }
    }

    return NextResponse.json({
      tutorials
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

