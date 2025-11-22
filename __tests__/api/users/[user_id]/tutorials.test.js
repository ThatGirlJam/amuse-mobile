import { GET } from '@/app/api/users/[user_id]/tutorials/route'
import { getUserById } from '@/lib/db/users'
import { getUserInteractionsWithTutorials } from '@/lib/db/user-tutorial-interactions'
import { getFeatureAnalysisByUserId } from '@/lib/db/feature-analysis'
import { getTutorialsByFeatures } from '@/lib/db/tutorials'
import { createMockRequest, createMockUser, createMockTutorial, createMockInteraction, createMockFeatureAnalysis } from '../../../helpers/test-helpers'

// Mock dependencies
jest.mock('@/lib/db/users')
jest.mock('@/lib/db/user-tutorial-interactions')
jest.mock('@/lib/db/feature-analysis')
jest.mock('@/lib/db/tutorials')

describe('GET /api/users/{user_id}/tutorials', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return all tutorials for user', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId })
    const mockTutorial = createMockTutorial()
    const mockInteraction = createMockInteraction({
      tutorials: mockTutorial
    })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getFeatureAnalysisByUserId.mockResolvedValue({ data: null, error: null })
    getUserInteractionsWithTutorials.mockResolvedValue({ 
      data: [mockInteraction], 
      error: null 
    })

    const request = {
      url: 'http://localhost:3000/api/users/test-user-id/tutorials?filter=all'
    }
    const params = Promise.resolve({ user_id: userId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tutorials).toBeDefined()
    expect(data.tutorials.length).toBe(1)
    expect(data.tutorials[0].tutorial_id).toBe(mockTutorial.id)
  })

  it('should filter saved tutorials', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId })
    const mockTutorial = createMockTutorial()
    const savedInteraction = createMockInteraction({
      tutorials: mockTutorial,
      is_saved: true
    })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getFeatureAnalysisByUserId.mockResolvedValue({ data: null, error: null })
    getUserInteractionsWithTutorials.mockResolvedValue({ 
      data: [savedInteraction], 
      error: null 
    })

    const request = {
      url: 'http://localhost:3000/api/users/test-user-id/tutorials?filter=saved'
    }
    const params = Promise.resolve({ user_id: userId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(getUserInteractionsWithTutorials).toHaveBeenCalledWith(userId, { savedOnly: true, likedOnly: false })
  })

  it('should filter liked tutorials', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId })
    const mockTutorial = createMockTutorial()
    const likedInteraction = createMockInteraction({
      tutorials: mockTutorial,
      is_liked: true
    })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getFeatureAnalysisByUserId.mockResolvedValue({ data: null, error: null })
    getUserInteractionsWithTutorials.mockResolvedValue({ 
      data: [likedInteraction], 
      error: null 
    })

    const request = {
      url: 'http://localhost:3000/api/users/test-user-id/tutorials?filter=liked'
    }
    const params = Promise.resolve({ user_id: userId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(getUserInteractionsWithTutorials).toHaveBeenCalledWith(userId, { savedOnly: false, likedOnly: true })
  })

  it('should include feature-matched tutorials when filter is all', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId })
    const mockFeatureAnalysis = createMockFeatureAnalysis()
    const mockTutorial1 = createMockTutorial({ id: 'tutorial-1' })
    const mockTutorial2 = createMockTutorial({ id: 'tutorial-2' })
    const mockInteraction = createMockInteraction({
      tutorials: mockTutorial1
    })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getFeatureAnalysisByUserId.mockResolvedValue({ data: mockFeatureAnalysis, error: null })
    getUserInteractionsWithTutorials.mockResolvedValue({ 
      data: [mockInteraction], 
      error: null 
    })
    getTutorialsByFeatures.mockResolvedValue({ 
      data: [mockTutorial2], 
      error: null 
    })

    const request = {
      url: 'http://localhost:3000/api/users/test-user-id/tutorials?filter=all'
    }
    const params = Promise.resolve({ user_id: userId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tutorials.length).toBe(2)
    expect(getTutorialsByFeatures).toHaveBeenCalledWith(
      {
        eye_shape: 'almond',
        nose: 'medium',
        lips: 'full'
      },
      { limit: 50 }
    )
  })

  it('should return 404 if user not found', async () => {
    getUserById.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const request = {
      url: 'http://localhost:3000/api/users/non-existent/tutorials'
    }
    const params = Promise.resolve({ user_id: 'non-existent' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('should return 400 for invalid filter', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId })

    getUserById.mockResolvedValue({ data: mockUser, error: null })

    const request = {
      url: 'http://localhost:3000/api/users/test-user-id/tutorials?filter=invalid'
    }
    const params = Promise.resolve({ user_id: userId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid filter')
  })

  it('should sort tutorials by view count and score', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId })
    const tutorial1 = createMockTutorial({ id: 't1', score: 5 })
    const tutorial2 = createMockTutorial({ id: 't2', score: 3 })
    const interaction1 = createMockInteraction({
      tutorials: tutorial1,
      view_count: 2
    })
    const interaction2 = createMockInteraction({
      tutorials: tutorial2,
      view_count: 5
    })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getFeatureAnalysisByUserId.mockResolvedValue({ data: null, error: null })
    getUserInteractionsWithTutorials.mockResolvedValue({ 
      data: [interaction1, interaction2], 
      error: null 
    })

    const request = {
      url: 'http://localhost:3000/api/users/test-user-id/tutorials?filter=all'
    }
    const params = Promise.resolve({ user_id: userId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    // tutorial2 should come first because it has higher view_count
    expect(data.tutorials[0].tutorial_id).toBe('t2')
    expect(data.tutorials[0].view_count).toBe(5)
  })
})

