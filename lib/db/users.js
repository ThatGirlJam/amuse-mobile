import { supabase } from '../supabase'

/**
 * Create a new user
 * @param {Object} userData - User data object
 * @param {string} userData.email - User email
 * @param {string} userData.password_hash - Hashed password
 * @param {string} [userData.full_name] - Full name
 * @param {string} [userData.location] - Location
 * @param {string} [userData.timezone] - Timezone
 * @param {string} [userData.mobile_number] - Mobile number
 * @param {string} [userData.date_of_birth] - Date of birth (YYYY-MM-DD)
 * @param {string} [userData.feature_analysis_id] - Feature analysis ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createUser(userData) {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single()

  return { data, error }
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  return { data, error }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

/**
 * Link feature analysis to user
 * @param {string} userId - User ID
 * @param {string} featureAnalysisId - Feature analysis ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function linkFeatureAnalysisToUser(userId, featureAnalysisId) {
  return updateUser(userId, { feature_analysis_id: featureAnalysisId })
}

