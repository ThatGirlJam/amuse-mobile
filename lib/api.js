/**
 * API Service for Facial Analysis
 *
 * Handles all communication with the Python backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

    // Make request to backend
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    // Parse response
    const data = await response.json();

    // Handle errors
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Analysis failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
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
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error('API is not healthy');
    }

    return data;
  } catch (error) {
    console.error('Health Check Error:', error);
    throw error;
  }
}
