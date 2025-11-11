/**
 * API Service for Facial Analysis
 *
 * Handles all communication with the Python backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, status, type = 'API_ERROR') {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.type = type;
  }
}

/**
 * Handle fetch errors with better error messages
 */
function handleFetchError(error, context = 'API request') {
  if (error instanceof APIError) {
    throw error;
  }

  // Network errors
  if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
    throw new APIError(
      'Unable to connect to the server. Please ensure the backend is running.',
      0,
      'NETWORK_ERROR'
    );
  }

  // Timeout errors
  if (error.name === 'AbortError') {
    throw new APIError(
      'Request timed out. Please try again.',
      0,
      'TIMEOUT_ERROR'
    );
  }

  // Generic error
  throw new APIError(
    error.message || `${context} failed`,
    0,
    'UNKNOWN_ERROR'
  );
}

/**
 * Analyze facial features from an image
 *
 * @param {File} imageFile - The image file to analyze
 * @param {boolean} saveToDb - Whether to save results to database (default: true)
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeFace(imageFile, saveToDb = true) {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('save', saveToDb.toString());

    // Make request to backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    const data = await response.json();

    // Handle errors with specific error types
    if (!response.ok) {
      const errorMessage = data.message || data.error || 'Analysis failed';
      let errorType = 'ANALYSIS_ERROR';

      // Categorize errors
      if (response.status === 400) {
        if (errorMessage.toLowerCase().includes('no face')) {
          errorType = 'NO_FACE_DETECTED';
        } else if (errorMessage.toLowerCase().includes('multiple faces')) {
          errorType = 'MULTIPLE_FACES';
        } else {
          errorType = 'INVALID_IMAGE';
        }
      } else if (response.status === 413) {
        errorType = 'FILE_TOO_LARGE';
      } else if (response.status === 415) {
        errorType = 'UNSUPPORTED_FORMAT';
      } else if (response.status >= 500) {
        errorType = 'SERVER_ERROR';
      }

      throw new APIError(errorMessage, response.status, errorType);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    handleFetchError(error, 'Facial analysis');
  }
}

/**
 * Get a specific analysis result by ID
 *
 * @param {number} resultId - The ID of the analysis result
 * @returns {Promise<Object>} Analysis result
 */
export async function getAnalysisResult(resultId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/results/${resultId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to fetch result');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Get recent analysis results
 *
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum results to return
 * @param {string} options.eye_shape - Filter by eye shape
 * @param {string} options.nose_width - Filter by nose width
 * @param {string} options.lip_fullness - Filter by lip fullness
 * @returns {Promise<Object>} List of analysis results
 */
export async function getAnalysisResults(options = {}) {
  try {
    const params = new URLSearchParams();

    if (options.limit) params.append('limit', options.limit);
    if (options.eye_shape) params.append('eye_shape', options.eye_shape);
    if (options.nose_width) params.append('nose_width', options.nose_width);
    if (options.lip_fullness) params.append('lip_fullness', options.lip_fullness);

    const url = `${API_BASE_URL}/api/results${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to fetch results');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Delete an analysis result
 *
 * @param {number} resultId - The ID of the analysis result to delete
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteAnalysisResult(resultId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/results/${resultId}`, {
      method: 'DELETE',
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to delete result');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Check if API is healthy
 *
 * @returns {Promise<Object>} Health check response
 */
export async function checkHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new APIError('API is not healthy', response.status, 'HEALTH_CHECK_FAILED');
    }

    return data;
  } catch (error) {
    console.error('Health Check Error:', error);
    handleFetchError(error, 'Health check');
  }
}
