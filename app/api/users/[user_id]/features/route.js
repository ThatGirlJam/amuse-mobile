import { NextResponse } from 'next/server'
import { getUserById } from '@/lib/db/users'
import { createFeatureAnalysis, updateFeatureAnalysis, getFeatureAnalysisByUserId } from '@/lib/db/feature-analysis'
import { linkFeatureAnalysisToUser } from '@/lib/db/users'

/**
 * POST /api/users/{user_id}/features
 * Save and update user's facial features
 */
export async function POST(request, { params }) {
  try {
    const { user_id } = await params
    const body = await request.json()
    const { eye_shape, nose, lips, image } = body

    // Verify user exists
    const { data: user, error: userError } = await getUserById(user_id)
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has a feature analysis
    const existingAnalysisId = user.feature_analysis_id

    let featureAnalysisId
    let features

    if (existingAnalysisId) {
      // Update existing feature analysis
      const { data: updated, error: updateError } = await updateFeatureAnalysis(
        existingAnalysisId,
        { eye_shape, nose, lips, image }
      )

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update feature analysis', details: updateError.message },
          { status: 500 }
        )
      }

      featureAnalysisId = updated.id
      features = {
        eye_shape: updated.eye_shape,
        nose: updated.nose,
        lips: updated.lips
      }
    } else {
      // Create new feature analysis
      const { data: created, error: createError } = await createFeatureAnalysis({
        eye_shape,
        nose,
        lips,
        image
      })

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create feature analysis', details: createError.message },
          { status: 500 }
        )
      }

      featureAnalysisId = created.id
      features = {
        eye_shape: created.eye_shape,
        nose: created.nose,
        lips: created.lips
      }

      // Link feature analysis to user
      const { error: linkError } = await linkFeatureAnalysisToUser(user_id, featureAnalysisId)
      if (linkError) {
        return NextResponse.json(
          { error: 'Failed to link feature analysis to user', details: linkError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: 'Feature analysis saved successfully',
      feature_analysis_id: featureAnalysisId,
      features
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/users/{user_id}/features
 * Get user's facial features
 */
export async function GET(request, { params }) {
  try {
    const { user_id } = await params

    // Verify user exists
    const { data: user, error: userError } = await getUserById(user_id)
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get feature analysis
    const { data: analysis, error: analysisError } = await getFeatureAnalysisByUserId(user_id)

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Feature analysis not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      feature_analysis_id: analysis.id,
      eye_shape: analysis.eye_shape,
      nose: analysis.nose,
      lips: analysis.lips,
      created_at: analysis.created_at
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

