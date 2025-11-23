import { NextResponse } from 'next/server'
import { getCachedResults } from '@/lib/cache'

/**
 * GET /api/tutorials/cache/{query}
 * Returns cached YouTube API results by query
 */
export async function GET(request, { params }) {
  try {
    const { query } = await params

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Decode the query (URL encoded)
    const decodedQuery = decodeURIComponent(query)

    // Get cached results
    const cached = await getCachedResults(decodedQuery)

    return NextResponse.json({
      exists: cached.exists,
      items: cached.items,
      cached_at: cached.cached_at
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

