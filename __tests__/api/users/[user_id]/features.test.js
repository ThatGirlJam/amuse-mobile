import { POST, GET } from '@/app/api/users/[user_id]/features/route'
import { getUserById } from '@/lib/db/users'
import { createFeatureAnalysis, updateFeatureAnalysis, getFeatureAnalysisByUserId } from '@/lib/db/feature-analysis'
import { linkFeatureAnalysisToUser } from '@/lib/db/users'
import { createMockUser, createMockFeatureAnalysis, createMockRequest } from '../../../helpers/test-helpers'

// Mock the database functions
jest.mock('@/lib/db/users')
jest.mock('@/lib/db/feature-analysis')

describe('POST /api/users/{user_id}/features', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create new feature analysis for user without existing analysis', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId, feature_analysis_id: null })
    const mockFeatureAnalysis = createMockFeatureAnalysis()

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    createFeatureAnalysis.mockResolvedValue({ data: mockFeatureAnalysis, error: null })
    linkFeatureAnalysisToUser.mockResolvedValue({ data: mockUser, error: null })

    const request = createMockRequest({
      eye_shape: 'almond',
      nose: 'medium',
      lips: 'full',
      image: 'test-image-ref'
    })
    const params = Promise.resolve({ user_id: userId })

    const response = await POST(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Feature analysis saved successfully')
    expect(data.feature_analysis_id).toBe(mockFeatureAnalysis.id)
    expect(data.features).toEqual({
      eye_shape: 'almond',
      nose: 'medium',
      lips: 'full'
    })
    expect(createFeatureAnalysis).toHaveBeenCalledWith({
      eye_shape: 'almond',
      nose: 'medium',
      lips: 'full',
      image: 'test-image-ref'
    })
    expect(linkFeatureAnalysisToUser).toHaveBeenCalledWith(userId, mockFeatureAnalysis.id)
  })

  it('should update existing feature analysis', async () => {
    const userId = 'test-user-id'
    const existingAnalysisId = 'existing-analysis-id'
    const mockUser = createMockUser({ id: userId, feature_analysis_id: existingAnalysisId })
    const updatedAnalysis = createMockFeatureAnalysis({ id: existingAnalysisId })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    updateFeatureAnalysis.mockResolvedValue({ data: updatedAnalysis, error: null })

    const request = createMockRequest({
      eye_shape: 'round',
      nose: 'small',
      lips: 'thin'
    })
    const params = Promise.resolve({ user_id: userId })

    const response = await POST(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.feature_analysis_id).toBe(existingAnalysisId)
    expect(updateFeatureAnalysis).toHaveBeenCalledWith(existingAnalysisId, {
      eye_shape: 'round',
      nose: 'small',
      lips: 'thin',
      image: undefined
    })
  })

  it('should return 404 if user not found', async () => {
    getUserById.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const request = createMockRequest({ eye_shape: 'almond' })
    const params = Promise.resolve({ user_id: 'non-existent-user' })

    const response = await POST(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('should handle database errors', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    createFeatureAnalysis.mockResolvedValue({ 
      data: null, 
      error: { message: 'Database error' } 
    })

    const request = createMockRequest({ eye_shape: 'almond' })
    const params = Promise.resolve({ user_id: userId })

    const response = await POST(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create feature analysis')
  })
})

describe('GET /api/users/{user_id}/features', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user features successfully', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId })
    const mockFeatureAnalysis = createMockFeatureAnalysis()

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getFeatureAnalysisByUserId.mockResolvedValue({ data: mockFeatureAnalysis, error: null })

    const request = createMockRequest()
    const params = Promise.resolve({ user_id: userId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.feature_analysis_id).toBe(mockFeatureAnalysis.id)
    expect(data.eye_shape).toBe('almond')
    expect(data.nose).toBe('medium')
    expect(data.lips).toBe('full')
    expect(data.created_at).toBeDefined()
  })

  it('should return 404 if user not found', async () => {
    getUserById.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const request = createMockRequest()
    const params = Promise.resolve({ user_id: 'non-existent-user' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('should return 404 if feature analysis not found', async () => {
    const userId = 'test-user-id'
    const mockUser = createMockUser({ id: userId })

    getUserById.mockResolvedValue({ data: mockUser, error: null })
    getFeatureAnalysisByUserId.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const request = createMockRequest()
    const params = Promise.resolve({ user_id: userId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Feature analysis not found')
  })
})

