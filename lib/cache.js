import { supabase } from './supabase'

/**
 * Cache YouTube API results in Supabase
 * Note: This assumes you have a cache table. If not, you can use a simple JSON file or Redis.
 * For now, we'll use a simple in-memory cache that can be extended.
 */

// In-memory cache (will be lost on server restart)
// In production, consider using Redis or a database table
const memoryCache = new Map()

/**
 * Get cached YouTube results
 * @param {string} query - Search query
 * @returns {Promise<{exists: boolean, items: Array|null, cached_at: string|null}>}
 */
export async function getCachedResults(query) {
  // Check memory cache first
  const cached = memoryCache.get(query)
  if (cached) {
    return {
      exists: true,
      items: cached.items,
      cached_at: cached.cached_at
    }
  }

  // TODO: If you create a cache table in Supabase, query it here
  // For now, return not cached
  return {
    exists: false,
    items: null,
    cached_at: null
  }
}

/**
 * Save YouTube results to cache
 * @param {string} query - Search query
 * @param {Array} items - YouTube API response items
 */
export async function saveCachedResults(query, items) {
  const cached_at = new Date().toISOString()
  
  // Save to memory cache
  memoryCache.set(query, {
    items,
    cached_at
  })

  // TODO: If you create a cache table in Supabase, save it here
  // Example:
  // await supabase.from('youtube_cache').upsert({
  //   query,
  //   items,
  //   cached_at
  // })
}

