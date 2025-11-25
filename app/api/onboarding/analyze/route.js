import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getUserById, updateUser, linkFeatureAnalysisToUser } from '@/lib/db/users'
import { createFeatureAnalysis } from '@/lib/db/feature-analysis'
import FormData from 'form-data'
import fetch from 'node-fetch'

/**
 * POST /api/onboarding/analyze
 * Analyze user's facial features from captured image
 * 1. Save image to Supabase storage
 * 2. Call CV model API for analysis
 * 3. Save analysis results to feature_analysis table
 * 4. Update user record with image URL and feature_analysis_id
 */
export async function POST(request) {
  try {
    // Get current user from session
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

    // Get user data
    const { data: user, error: userError } = await getUserById(authUser.id)
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get image from request body (base64 data URL)
    const body = await request.json()
    const { imageDataUrl } = body

    if (!imageDataUrl) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    // Convert base64 data URL to blob
    const base64Data = imageDataUrl.split(',')[1] // Remove data:image/png;base64, prefix
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${authUser.id}/${timestamp}-profile.png`
    
    // Create service role client for storage operations (bypasses RLS)
    // This uses the service role key which has full access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Service role key not found' },
        { status: 500 }
      )
    }
    
    // Create service role client - this bypasses RLS policies
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Upload image to Supabase storage using service role client
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('profile-pictures')
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded image
    const { data: urlData } = serviceSupabase.storage
      .from('profile-pictures')
      .getPublicUrl(filename)
    
    const imageUrl = urlData.publicUrl

    // Call CV model API for analysis
    const cvModelUrl = process.env.CV_MODEL_API_URL || 'http://localhost:5000'
    
    // Create FormData for CV model API using form-data package
    // Flask expects multipart/form-data with a file field named "image"
    const formData = new FormData()
    // Append buffer as file - must include filename for Flask to recognize it as a file
    formData.append('image', imageBuffer, {
      filename: 'profile.png',
      contentType: 'image/png'
    })
    formData.append('save', 'false') // Don't save to CV model's database, we'll save to our own

    let analysisResult
    try {
      // Get headers with boundary - form-data package sets Content-Type with boundary
      const headers = formData.getHeaders()
      
      // Use fetch with form-data stream
      // Note: Node.js fetch should handle form-data streams, but we need to ensure
      // the Content-Type header with boundary is set correctly
      const cvResponse = await fetch(`${cvModelUrl}/api/analyze`, {
        method: 'POST',
        body: formData, // form-data is a stream that fetch can handle
        headers: headers // Includes Content-Type: multipart/form-data; boundary=...
      })

      if (!cvResponse.ok) {
        const errorData = await cvResponse.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'CV model analysis failed')
      }

      const cvData = await cvResponse.json()
      
      if (!cvData.success || !cvData.data) {
        throw new Error(cvData.error || 'CV model returned invalid response')
      }

      analysisResult = cvData.data
    } catch (error) {
      console.error('Error calling CV model:', error)
      
      // Check if it's a connection error
      const isConnectionError = error.code === 'ECONNREFUSED' || 
                                error.message.includes('ECONNREFUSED') ||
                                error.message.includes('fetch failed')
      
      // Clean up uploaded image if analysis fails
      await serviceSupabase.storage.from('profile-pictures').remove([filename])
      
      if (isConnectionError) {
        return NextResponse.json(
          { 
            error: 'CV model service is not available', 
            details: `Cannot connect to CV model API at ${cvModelUrl}. Please ensure the CV model service is running.`
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to analyze image', details: error.message },
        { status: 500 }
      )
    }

    // Extract feature data from analysis result
    const eyeAnalysis = analysisResult.eye_analysis || {}
    const noseAnalysis = analysisResult.nose_analysis || {}
    const lipAnalysis = analysisResult.lip_analysis || {}

    // Save feature analysis to database
    const { data: featureAnalysis, error: analysisError } = await createFeatureAnalysis({
      eye_shape: eyeAnalysis.eye_shape || 'unknown',
      nose: noseAnalysis.nose_width || 'unknown',
      lips: lipAnalysis.lip_fullness || 'unknown',
      image: imageUrl // Store the image URL in feature_analysis table
    })

    if (analysisError) {
      console.error('Error saving feature analysis:', analysisError)
      // Clean up uploaded image if save fails
      await serviceSupabase.storage.from('profile-pictures').remove([filename])
      
      return NextResponse.json(
        { error: 'Failed to save feature analysis', details: analysisError.message },
        { status: 500 }
      )
    }

    // Link feature analysis to user and update profile picture
    const { error: linkError } = await linkFeatureAnalysisToUser(authUser.id, featureAnalysis.id)
    if (linkError) {
      console.error('Error linking feature analysis:', linkError)
      return NextResponse.json(
        { error: 'Failed to link feature analysis to user', details: linkError.message },
        { status: 500 }
      )
    }

    // Update user with profile picture URL
    const { error: updateError } = await updateUser(authUser.id, {
      profile_picture_url: imageUrl
    })

    if (updateError) {
      console.error('Error updating user profile picture:', updateError)
      // Don't fail the request if profile picture update fails, but log it
    }

    return NextResponse.json({
      success: true,
      message: 'Image analyzed and saved successfully',
      data: {
        feature_analysis_id: featureAnalysis.id,
        profile_picture_url: imageUrl,
        features: {
          eye_shape: featureAnalysis.eye_shape,
          nose: featureAnalysis.nose,
          lips: featureAnalysis.lips
        },
        full_analysis: analysisResult
      }
    })
  } catch (error) {
    console.error('Error in onboarding analyze:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

