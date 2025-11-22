// Mock cache
const memoryCache = new Map()

export async function getCachedResults(query) {
  const cached = memoryCache.get(query)
  if (cached) {
    return {
      exists: true,
      items: cached.items,
      cached_at: cached.cached_at
    }
  }
  return {
    exists: false,
    items: null,
    cached_at: null
  }
}

export async function saveCachedResults(query, items) {
  memoryCache.set(query, {
    items,
    cached_at: new Date().toISOString()
  })
}

