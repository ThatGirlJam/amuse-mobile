import { POST } from '@/app/api/tutorials/search/route'
import { generateSearchQueries, searchYouTube, scoreAndProcessResults } from '@/lib/youtube'
import { getCachedResults, saveCachedResults } from '@/lib/cache'
import { getTutorialByUrl, createTutorial, updateTutorial } from '@/lib/db/tutorials'
import { createMockRequest, createMockTutorial } from '../../helpers/test-helpers'

// Mock dependencies
jest.mock('@/lib/youtube')
jest.mock('@/lib/cache')
jest.mock('@/lib/db/tutorials')

describe('POST /api/tutorials/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should search tutorials successfully with cached results', async () => {
    const mockQueries = ['makeup tutorial for almond eyes', 'makeup tutorial for medium nose']
    const mockYouTubeItems = [
      {
        id: { videoId: 'test-video-1' },
        snippet: {
          title: 'Makeup Tutorial for Almond Eyes',
          description: 'Learn makeup for almond eyes',
          channelTitle: 'Test Channel'
        }
      }
    ]
    const mockScoredResults = [
      {
        title: 'Makeup Tutorial for Almond Eyes',
        url: 'https://youtube.com/watch?v=test-video-1',
        channel: 'Test Channel',
        matched_features: ['almond eyes'],
        score: 2,
        query: 'makeup tutorial for almond eyes'
      }
    ]
    const mockTutorial = createMockTutorial()

    generateSearchQueries.mockReturnValue(mockQueries)
    getCachedResults.mockResolvedValue({ exists: true, items: mockYouTubeItems, cached_at: new Date().toISOString() })
    scoreAndProcessResults.mockReturnValue(mockScoredResults)
    getTutorialByUrl.mockResolvedValue({ data: null, error: null })
    createTutorial.mockResolvedValue({ data: mockTutorial, error: null })

    const request = createMockRequest({
      user_id: 'test-user-id',
      eye_shape: 'almond',
      nose: 'medium',
      max_results: 10
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.cached).toBe(true)
    expect(data.query_set).toEqual(mockQueries)
    expect(data.results).toBeDefined()
    expect(generateSearchQueries).toHaveBeenCalledWith({ eye_shape: 'almond', nose: 'medium', lips: undefined })
  })

  it('should search tutorials with force_refresh', async () => {
    const mockQueries = ['makeup tutorial for almond eyes']
    const mockYouTubeResponse = {
      items: [
        {
          id: { videoId: 'test-video-1' },
          snippet: {
            title: 'Test Tutorial',
            description: 'Test description',
            channelTitle: 'Test Channel'
          }
        }
      ]
    }
    const mockScoredResults = [
      {
        title: 'Test Tutorial',
        url: 'https://youtube.com/watch?v=test-video-1',
        channel: 'Test Channel',
        matched_features: ['almond eyes'],
        score: 2,
        query: 'makeup tutorial for almond eyes'
      }
    ]
    const mockTutorial = createMockTutorial()

    generateSearchQueries.mockReturnValue(mockQueries)
    searchYouTube.mockResolvedValue(mockYouTubeResponse)
    scoreAndProcessResults.mockReturnValue(mockScoredResults)
    getTutorialByUrl.mockResolvedValue({ data: null, error: null })
    createTutorial.mockResolvedValue({ data: mockTutorial, error: null })

    const request = createMockRequest({
      user_id: 'test-user-id',
      eye_shape: 'almond',
      force_refresh: true
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(getCachedResults).not.toHaveBeenCalled()
    expect(searchYouTube).toHaveBeenCalled()
    expect(saveCachedResults).toHaveBeenCalled()
  })

  it('should return 400 if no features provided', async () => {
    const request = createMockRequest({
      user_id: 'test-user-id'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('At least one facial feature')
  })

  it('should update existing tutorial if score is higher', async () => {
    const mockQueries = ['makeup tutorial for almond eyes']
    const existingTutorial = createMockTutorial({ score: 1 })
    const updatedTutorial = createMockTutorial({ score: 5 })
    const mockScoredResults = [
      {
        title: existingTutorial.title,
        url: existingTutorial.url,
        channel: existingTutorial.channel,
        matched_features: ['almond eyes'],
        score: 5,
        query: 'makeup tutorial for almond eyes'
      }
    ]

    generateSearchQueries.mockReturnValue(mockQueries)
    getCachedResults.mockResolvedValue({ exists: false, items: null, cached_at: null })
    searchYouTube.mockResolvedValue({ items: [] })
    scoreAndProcessResults.mockReturnValue(mockScoredResults)
    getTutorialByUrl.mockResolvedValue({ data: existingTutorial, error: null })
    updateTutorial.mockResolvedValue({ data: updatedTutorial, error: null })

    const request = createMockRequest({
      eye_shape: 'almond',
      force_refresh: true
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(updateTutorial).toHaveBeenCalledWith(existingTutorial.id, {
      score: 5,
      matched_features: ['almond eyes'],
      query: 'makeup tutorial for almond eyes'
    })
  })

  it('should handle YouTube API errors gracefully', async () => {
    const mockQueries = ['makeup tutorial for almond eyes']

    generateSearchQueries.mockReturnValue(mockQueries)
    getCachedResults.mockResolvedValue({ exists: false, items: null, cached_at: null })
    searchYouTube.mockRejectedValue(new Error('YouTube API error'))

    const request = createMockRequest({
      eye_shape: 'almond',
      force_refresh: true
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results).toEqual([])
  })
})

