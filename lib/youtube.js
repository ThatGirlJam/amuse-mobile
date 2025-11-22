/**
 * YouTube Data API v3 integration
 * Requires YOUTUBE_DATA_API_KEY in environment variables
 */

/**
 * Generate search queries from facial features
 * Matches the Python implementation with feature-specific keyword variations
 * @param {Object} features - Facial features
 * @param {string} features.eye_shape - Eye shape
 * @param {string} features.nose - Nose type
 * @param {string} features.lips - Lip type
 * @returns {Array<string>} Array of search queries
 */
export function generateSearchQueries(features) {
  const queries = []
  
  // Map features to keyword arrays (matching Python logic)
  const featureKeywords = {}
  
  for (const [key, value] of Object.entries(features)) {
    if (!value) continue
    
    if (key.includes('eye')) {
      featureKeywords[key] = [`${value} eyes`, `makeup for ${value} eyes`]
    } else if (key.includes('nose')) {
      featureKeywords[key] = [`${value} nose`, `contouring for ${value} nose`]
    } else if (key.includes('lip')) {
      featureKeywords[key] = [`${value} lips`, `lip makeup for ${value} lips`]
    } else {
      featureKeywords[key] = [value]
    }
  }

  // Generate queries for each feature keyword variation
  for (const [key, vals] of Object.entries(featureKeywords)) {
    for (const val of vals) {
      queries.push(`makeup tutorial for ${val}`)
    }
  }

  // Add combo query with first value of each feature
  const comboValues = Object.values(featureKeywords).map(v => v[0])
  if (comboValues.length > 0) {
    queries.push(`makeup tutorial for ${comboValues.join(' ')}`)
  }

  return queries
}

/**
 * Clean string for pattern matching (removes non-alphanumeric characters except spaces)
 * Matches Python's regex pattern: re.sub(r"[^a-z0-9 ]", "", v.lower())
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
function cleanPattern(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, '')
}

/**
 * Search YouTube for videos
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} [options.maxResults=10] - Maximum results per query
 * @returns {Promise<Object>} YouTube API response
 */
export async function searchYouTube(query, options = {}) {
  const { maxResults = 10 } = options
  const apiKey = process.env.YOUTUBE_DATA_API_KEY

  if (!apiKey) {
    throw new Error('YOUTUBE_DATA_API_KEY is not set in environment variables')
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.append('part', 'snippet')
  url.searchParams.append('q', query)
  url.searchParams.append('type', 'video')
  url.searchParams.append('videoCategoryId', '26') // Howto & Style
  url.searchParams.append('maxResults', maxResults.toString())
  url.searchParams.append('key', apiKey)

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`YouTube API error: ${error.error?.message || 'Failed to fetch'}`)
  }

  return response.json()
}

/**
 * Score and process YouTube search results
 * Matches Python implementation with weighted scoring based on feature type
 * @param {Array} items - YouTube API response items
 * @param {Object} features - Original features for scoring
 * @param {string} query - Search query used
 * @returns {Array} Processed and scored results
 */
export function scoreAndProcessResults(items, features, query) {
  // Build feature keywords map (matching Python logic)
  const featureKeywords = {}
  
  for (const [key, value] of Object.entries(features)) {
    if (!value) continue
    
    if (key.includes('eye')) {
      featureKeywords[key] = [`${value} eyes`, `makeup for ${value} eyes`]
    } else if (key.includes('nose')) {
      featureKeywords[key] = [`${value} nose`, `contouring for ${value} nose`]
    } else if (key.includes('lip')) {
      featureKeywords[key] = [`${value} lips`, `lip makeup for ${value} lips`]
    } else {
      featureKeywords[key] = [value]
    }
  }

  const results = {}

  for (const item of items) {
    const vid = item.id.videoId
    const title = item.snippet.title.toLowerCase()
    const desc = item.snippet.description.toLowerCase()
    const text = title + ' ' + desc // Combined text for searching

    let score = 0
    const matched = []

    // Score based on feature keywords (matching Python scoring logic)
    for (const [key, vals] of Object.entries(featureKeywords)) {
      for (const val of vals) {
        // Clean pattern (remove non-alphanumeric except spaces)
        const pattern = cleanPattern(val)
        const cleanedText = cleanPattern(text)
        
        // Check if pattern matches in text
        if (cleanedText.includes(pattern)) {
          // Weighted scoring: eyes = 2, lips = 1.5, others = 1
          if (val.includes('eyes')) {
            score += 2
          } else if (val.includes('lips')) {
            score += 1.5
          } else {
            score += 1
          }
          
          if (!matched.includes(val)) {
            matched.push(val)
          }
        }
      }
    }

    // Keep the highest score for duplicate videos
    if (!results[vid] || score > results[vid].score) {
      results[vid] = {
        title: item.snippet.title,
        url: `https://youtube.com/watch?v=${vid}`,
        channel: item.snippet.channelTitle,
        matched_features: matched,
        score: score,
        query: query
      }
    }
  }

  return Object.values(results)
}

