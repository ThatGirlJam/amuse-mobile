import { GET } from '@/app/api/tutorials/cache/[query]/route'
import { getCachedResults } from '@/lib/cache'
import { createMockRequest } from '../../../helpers/test-helpers'

// Mock dependencies
jest.mock('@/lib/cache')

describe('GET /api/tutorials/cache/{query}', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return cached results when they exist', async () => {
    const query = 'makeup tutorial for almond eyes'
    const mockCachedData = {
      exists: true,
      items: [
        {
          id: { videoId: 'test-video-1' },
          snippet: {
            title: 'Test Tutorial',
            description: 'Test description',
            channelTitle: 'Test Channel'
          }
        }
      ],
      cached_at: new Date().toISOString()
    }

    getCachedResults.mockResolvedValue(mockCachedData)

    const request = createMockRequest()
    const params = Promise.resolve({ query })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.exists).toBe(true)
    expect(data.items).toEqual(mockCachedData.items)
    expect(data.cached_at).toBe(mockCachedData.cached_at)
    expect(getCachedResults).toHaveBeenCalledWith(query)
  })

  it('should return not cached when results do not exist', async () => {
    const query = 'makeup tutorial for round eyes'

    getCachedResults.mockResolvedValue({
      exists: false,
      items: null,
      cached_at: null
    })

    const request = createMockRequest()
    const params = Promise.resolve({ query })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.exists).toBe(false)
    expect(data.items).toBeNull()
    expect(data.cached_at).toBeNull()
  })

  it('should decode URL-encoded query', async () => {
    const query = 'makeup tutorial for almond eyes'
    const encodedQuery = encodeURIComponent(query)

    getCachedResults.mockResolvedValue({
      exists: false,
      items: null,
      cached_at: null
    })

    const request = createMockRequest()
    const params = Promise.resolve({ query: encodedQuery })

    await GET(request, { params })

    expect(getCachedResults).toHaveBeenCalledWith(query)
  })

  it('should handle special characters in query', async () => {
    const query = 'makeup tutorial: almond eyes & round face'
    const encodedQuery = encodeURIComponent(query)

    getCachedResults.mockResolvedValue({
      exists: true,
      items: [],
      cached_at: new Date().toISOString()
    })

    const request = createMockRequest()
    const params = Promise.resolve({ query: encodedQuery })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(getCachedResults).toHaveBeenCalledWith(query)
  })

  it('should handle errors gracefully', async () => {
    const query = 'test query'

    getCachedResults.mockRejectedValue(new Error('Cache error'))

    const request = createMockRequest()
    const params = Promise.resolve({ query })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})

