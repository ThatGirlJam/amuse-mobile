import { supabase } from '../supabase'

/**
 * Create a new feature analysis
 * @param {Object} analysisData - Feature analysis data
 * @param {string} [analysisData.eye_shape] - Eye shape
 * @param {string} [analysisData.nose] - Nose type
 * @param {string} [analysisData.lips] - Lip type
 * @param {string} [analysisData.image] - Image reference
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createFeatureAnalysis(analysisData) {
  const { data, error } = await supabase
    .from('feature_analysis')
    .insert([analysisData])
    .select()
    .single()

  return { data, error }
}

/**
 * Get feature analysis by ID
 * @param {string} analysisId - Feature analysis ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getFeatureAnalysisById(analysisId) {
  const { data, error } = await supabase
    .from('feature_analysis')
    .select('*')
    .eq('id', analysisId)
    .single()

  return { data, error }
}

/**
 * Update feature analysis
 * @param {string} analysisId - Feature analysis ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateFeatureAnalysis(analysisId, updates) {
  const { data, error } = await supabase
    .from('feature_analysis')
    .update(updates)
    .eq('id', analysisId)
    .select()
    .single()

  return { data, error }
}

/**
 * Get feature analysis by user ID (via users table)
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getFeatureAnalysisByUserId(userId) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('feature_analysis_id')
    .eq('id', userId)
    .single()

  if (userError || !user?.feature_analysis_id) {
    return { data: null, error: userError || new Error('No feature analysis found for user') }
  }

  return getFeatureAnalysisById(user.feature_analysis_id)
}

/**
 * Delete feature analysis by ID
 * @param {string} analysisId - Feature analysis ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function deleteFeatureAnalysis(analysisId) {
  const { data, error } = await supabase
    .from('feature_analysis')
    .delete()
    .eq('id', analysisId)
    .select()
    .single()

  return { data, error }
}

