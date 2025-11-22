// Test helper functions

/**
 * Create a mock Next.js request object
 */
export function createMockRequest(body = {}, params = {}) {
  return {
    json: jest.fn().mockResolvedValue(body),
    url: 'http://localhost:3000',
    method: 'POST',
    headers: new Headers(),
  }
}

/**
 * Create a mock Next.js route context with params
 */
export function createMockContext(params = {}) {
  return {
    params: Promise.resolve(params)
  }
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    password_hash: 'hashed-password',
    full_name: 'Test User',
    feature_analysis_id: null,
    ...overrides
  }
}

/**
 * Create a mock feature analysis object
 */
export function createMockFeatureAnalysis(overrides = {}) {
  return {
    id: 'test-feature-analysis-id',
    eye_shape: 'almond',
    nose: 'medium',
    lips: 'full',
    image: 'test-image-ref',
    created_at: new Date().toISOString(),
    ...overrides
  }
}

/**
 * Create a mock tutorial object
 */
export function createMockTutorial(overrides = {}) {
  return {
    id: 'test-tutorial-id',
    title: 'Test Tutorial',
    url: 'https://youtube.com/watch?v=test123',
    channel: 'Test Channel',
    score: 5,
    query: 'makeup tutorial for almond eyes',
    matched_features: ['almond eyes'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

/**
 * Create a mock user tutorial interaction
 */
export function createMockInteraction(overrides = {}) {
  return {
    id: 'test-interaction-id',
    user_id: 'test-user-id',
    tutorial_id: 'test-tutorial-id',
    is_saved: false,
    is_liked: false,
    view_count: 0,
    matched_features: null,
    created_at: new Date().toISOString(),
    ...overrides
  }
}

