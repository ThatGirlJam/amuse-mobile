import { NextResponse } from 'next/server'
import { generateSearchQueries, searchYouTube, scoreAndProcessResults } from '@/lib/youtube'
import { getCachedResults, saveCachedResults } from '@/lib/cache'
import { getTutorialByUrl, createTutorial, updateTutorial } from '@/lib/db/tutorials'

/**
 * POST /api/tutorials/search
 * Main endpoint to (Input: facial features → searches YouTube → scores → stores Tutorials → returns ranked list)
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { user_id, eye_shape, nose, lips, max_results = 20, force_refresh = false } = body

    if (!eye_shape && !nose && !lips) {
      return NextResponse.json(
        { error: 'At least one facial feature (eye_shape, nose, or lips) is required' },
        { status: 400 }
      )
    }

    const features = { eye_shape, nose, lips }
    const querySet = generateSearchQueries(features)
    
    const allResults = {}
    const processedQueries = []
    let anyCached = false
    const WAIT_BETWEEN_CALLS = 300 // 0.3 seconds in milliseconds (matching Python script)

    // Search YouTube for each query
    for (const query of querySet) {
      let responseItems = null
      let wasCached = false

      // Check cache unless force_refresh is true
      if (!force_refresh) {
        const cachedData = await getCachedResults(query)
        if (cachedData.exists) {
          responseItems = cachedData.items
          wasCached = true
          anyCached = true
          console.log(`⚡ Found in cache (${responseItems.length} items) for query: ${query}`)
        }
      }

      // Fetch from YouTube API if not cached or force_refresh
      if (!responseItems) {
        try {
          console.log(`🔍 Searching YouTube: ${query}`)
          const response = await searchYouTube(query, { maxResults: 10 })
          responseItems = response.items || []
          
          // Save to cache
          if (responseItems.length > 0) {
            await saveCachedResults(query, responseItems)
          }

          // Wait between API calls to avoid quota spikes (matching Python script)
          if (querySet.indexOf(query) < querySet.length - 1) {
            await new Promise(resolve => setTimeout(resolve, WAIT_BETWEEN_CALLS))
          }
        } catch (error) {
          console.error(`⚠️ Error on query '${query}':`, error)
          continue // Skip this query and continue with others
        }
      }

      // Process and score results
      const scoredResults = scoreAndProcessResults(responseItems, features, query)
      
      // Merge results (keep highest score for duplicates)
      for (const result of scoredResults) {
        const url = result.url
        if (!allResults[url] || result.score > allResults[url].score) {
          allResults[url] = result
        }
      }

      processedQueries.push(query)
    }

    // Convert to array and sort by score
    let sortedResults = Object.values(allResults)
      .sort((a, b) => b.score - a.score)
      .slice(0, max_results)

    // Store tutorials in database
    const storedTutorials = []
    for (const result of sortedResults) {
      try {
        // Check if tutorial already exists
        const { data: existing } = await getTutorialByUrl(result.url)
        
        let tutorial
        if (existing) {
          // Update if score is higher or if matched_features should be updated
          if (result.score > (existing.score || 0)) {
            const { data: updated, error: updateError } = await updateTutorial(existing.id, {
              score: result.score,
              matched_features: result.matched_features,
              query: result.query
            })
            if (!updateError && updated) {
              tutorial = updated
            } else {
              tutorial = existing
            }
          } else {
            tutorial = existing
          }
        } else {
          // Create new tutorial
          const { data: created, error: createError } = await createTutorial({
            title: result.title,
            url: result.url,
            channel: result.channel,
            score: result.score,
            query: result.query,
            matched_features: result.matched_features
          })

          if (!createError && created) {
            tutorial = created
          }
        }

        if (tutorial) {
          storedTutorials.push(tutorial)
        }
      } catch (error) {
        console.error(`Error storing tutorial "${result.title}":`, error)
        // Continue with other tutorials
      }
    }

    // Format response
    const formattedResults = storedTutorials.map(tutorial => ({
      tutorial_id: tutorial.id,
      title: tutorial.title,
      url: tutorial.url,
      channel: tutorial.channel,
      score: tutorial.score,
      query: tutorial.query,
      matched_features: tutorial.matched_features
    }))

    return NextResponse.json({
      cached: anyCached, // Indicates if any results came from cache
      query_set: processedQueries,
      results: formattedResults
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

