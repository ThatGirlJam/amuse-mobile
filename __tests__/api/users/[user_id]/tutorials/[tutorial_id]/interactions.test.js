import { POST } from '@/app/api/users/[user_id]/tutorials/[tutorial_id]/interactions/route'
import { getUserById } from '@/lib/db/users'
import { getTutorialById } from '@/lib/db/tutorials'
import { upsertUserTutorialInteraction, getUserTutorialInteraction } from '@/lib/db/user-tutorial-interactions'
import { createMockRequest, createMockUser, createMockTutorial, createMockInteraction } from '../../../../../helpers/test-helpers'

// Mock dependencies
jest.mock('@/lib/db/users')
jest.mock('@/lib/db/tutorials')
jest.mock('@/lib/db/user-tutorial-interactions')

describe('POST /api/users/{user_id}/tutorials/{tutorial_id}/interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create new interaction successfully', async () => {
    const userId = 'test-user-id'
    const tutorialId = 'test-tutorial-id'
    const mockUser = createMockUser({ id: userId })
    const mockTutorial = createMockTutorial({ id: tutorialId })
    const mockInteraction = createMockInteraction({
      user_id: userId,
      tutorial_id: tutorialId,
      is_saved: true,
      is_liked: false,
      view_count: 1
    })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getTutorialById.mockResolvedValue({ data: mockTutorial, error: null })
    getUserTutorialInteraction.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    upsertUserTutorialInteraction.mockResolvedValue({ data: mockInteraction, error: null })

    const request = createMockRequest({
      is_saved: true,
      increment_view: true
    })
    const params = Promise.resolve({ user_id: userId, tutorial_id: tutorialId })

    const response = await POST(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user_id).toBe(userId)
    expect(data.tutorial_id).toBe(tutorialId)
    expect(data.is_saved).toBe(true)
    expect(data.view_count).toBe(1)
  })

  it('should update existing interaction', async () => {
    const userId = 'test-user-id'
    const tutorialId = 'test-tutorial-id'
    const mockUser = createMockUser({ id: userId })
    const mockTutorial = createMockTutorial({ id: tutorialId })
    const existingInteraction = createMockInteraction({
      user_id: userId,
      tutorial_id: tutorialId,
      is_saved: false,
      is_liked: false,
      view_count: 2
    })
    const updatedInteraction = createMockInteraction({
      ...existingInteraction,
      is_saved: true,
      view_count: 3
    })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getTutorialById.mockResolvedValue({ data: mockTutorial, error: null })
    getUserTutorialInteraction.mockResolvedValue({ data: existingInteraction, error: null })
    upsertUserTutorialInteraction.mockResolvedValue({ data: updatedInteraction, error: null })

    const request = createMockRequest({
      is_saved: true,
      increment_view: true
    })
    const params = Promise.resolve({ user_id: userId, tutorial_id: tutorialId })

    const response = await POST(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.is_saved).toBe(true)
    expect(data.view_count).toBe(3)
  })

  it('should return 404 if user not found', async () => {
    getUserById.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const request = createMockRequest({ is_saved: true })
    const params = Promise.resolve({ user_id: 'non-existent', tutorial_id: 'test-tutorial-id' })

    const response = await POST(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('should return 404 if tutorial not found', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getTutorialById.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const request = createMockRequest({ is_saved: true })
    const params = Promise.resolve({ user_id: userId, tutorial_id: 'non-existent' })

    const response = await POST(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Tutorial not found')
  })

  it('should handle matched_features', async () => {
    const userId = 'test-user-id'
    const tutorialId = 'test-tutorial-id'
    const mockUser = createMockUser({ id: userId })
    const mockTutorial = createMockTutorial({ id: tutorialId })
    const mockInteraction = createMockInteraction({
      user_id: userId,
      tutorial_id: tutorialId,
      matched_features: { eye_shape: 'almond' }
    })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getTutorialById.mockResolvedValue({ data: mockTutorial, error: null })
    getUserTutorialInteraction.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    upsertUserTutorialInteraction.mockResolvedValue({ data: mockInteraction, error: null })

    const request = createMockRequest({
      matched_features: { eye_shape: 'almond' }
    })
    const params = Promise.resolve({ user_id: userId, tutorial_id: tutorialId })

    const response = await POST(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.matched_features).toEqual({ eye_shape: 'almond' })
  })
})

