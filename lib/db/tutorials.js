import { supabase } from '../supabase'

/**
 * Create a new tutorial
 * @param {Object} tutorialData - Tutorial data
 * @param {string} tutorialData.title - Tutorial title
 * @param {string} tutorialData.url - Tutorial URL (must be unique)
 * @param {string} [tutorialData.channel] - Channel name
 * @param {number} [tutorialData.score] - Score
 * @param {string} [tutorialData.query] - Search query
 * @param {Object} [tutorialData.matched_features] - Matched features (JSONB)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createTutorial(tutorialData) {
  const { data, error } = await supabase
    .from('tutorials')
    .insert([tutorialData])
    .select()
    .single()

  return { data, error }
}

/**
 * Get tutorial by ID
 * @param {string} tutorialId - Tutorial ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getTutorialById(tutorialId) {
  const { data, error } = await supabase
    .from('tutorials')
    .select('*')
    .eq('id', tutorialId)
    .single()

  return { data, error }
}

/**
 * Get tutorial by URL
 * @param {string} url - Tutorial URL
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getTutorialByUrl(url) {
  const { data, error } = await supabase
    .from('tutorials')
    .select('*')
    .eq('url', url)
    .single()

  return { data, error }
}

/**
 * Search tutorials by query
 * @param {string} query - Search query
 * @param {Object} [options] - Query options
 * @param {number} [options.limit] - Limit results
 * @param {number} [options.offset] - Offset for pagination
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function searchTutorialsByQuery(query, options = {}) {
  const { limit = 10, offset = 0 } = options
  
  const { data, error } = await supabase
    .from('tutorials')
    .select('*')
    .eq('query', query)
    .order('score', { ascending: false, nullsLast: true })
    .range(offset, offset + limit - 1)

  return { data, error }
}

/**
 * Get tutorials by matched features
 * @param {Object} features - Features to match
 * @param {Object} [options] - Query options
 * @param {number} [options.limit] - Limit results
 * @param {number} [options.offset] - Offset for pagination
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getTutorialsByFeatures(features, options = {}) {
  const { limit = 10, offset = 0 } = options
  
  const { data, error } = await supabase
    .from('tutorials')
    .select('*')
    .contains('matched_features', features)
    .order('score', { ascending: false, nullsLast: true })
    .range(offset, offset + limit - 1)

  return { data, error }
}

/**
 * Update tutorial
 * @param {string} tutorialId - Tutorial ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateTutorial(tutorialId, updates) {
  const { data, error } = await supabase
    .from('tutorials')
    .update(updates)
    .eq('id', tutorialId)
    .select()
    .single()

  return { data, error }
}

