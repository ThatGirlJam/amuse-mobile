import { supabase } from '../supabase'

/**
 * Create or update user tutorial interaction
 * @param {Object} interactionData - Interaction data
 * @param {string} interactionData.user_id - User ID
 * @param {string} interactionData.tutorial_id - Tutorial ID
 * @param {Object} [interactionData.matched_features] - Matched features (JSONB)
 * @param {boolean} [interactionData.is_saved] - Is saved
 * @param {boolean} [interactionData.is_liked] - Is liked
 * @param {number} [interactionData.view_count] - View count
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function upsertUserTutorialInteraction(interactionData) {
  const { data, error } = await supabase
    .from('user_tutorial_interactions')
    .upsert(interactionData, {
      onConflict: 'user_id,tutorial_id'
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Get user tutorial interaction
 * @param {string} userId - User ID
 * @param {string} tutorialId - Tutorial ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getUserTutorialInteraction(userId, tutorialId) {
  const { data, error } = await supabase
    .from('user_tutorial_interactions')
    .select('*')
    .eq('user_id', userId)
    .eq('tutorial_id', tutorialId)
    .single()

  return { data, error }
}

/**
 * Get all interactions for a user
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @param {boolean} [options.savedOnly] - Only return saved tutorials
 * @param {boolean} [options.likedOnly] - Only return liked tutorials
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getUserInteractions(userId, options = {}) {
  let query = supabase
    .from('user_tutorial_interactions')
    .select('*')
    .eq('user_id', userId)

  if (options.savedOnly) {
    query = query.eq('is_saved', true)
  }

  if (options.likedOnly) {
    query = query.eq('is_liked', true)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Get interactions with tutorial details for a user
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @param {boolean} [options.savedOnly] - Only return saved tutorials
 * @param {boolean} [options.likedOnly] - Only return liked tutorials
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getUserInteractionsWithTutorials(userId, options = {}) {
  let query = supabase
    .from('user_tutorial_interactions')
    .select(`
      *,
      tutorials (*)
    `)
    .eq('user_id', userId)

  if (options.savedOnly) {
    query = query.eq('is_saved', true)
  }

  if (options.likedOnly) {
    query = query.eq('is_liked', true)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Update user tutorial interaction
 * @param {string} userId - User ID
 * @param {string} tutorialId - Tutorial ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateUserTutorialInteraction(userId, tutorialId, updates) {
  const { data, error } = await supabase
    .from('user_tutorial_interactions')
    .update(updates)
    .eq('user_id', userId)
    .eq('tutorial_id', tutorialId)
    .select()
    .single()

  return { data, error }
}

/**
 * Increment view count for a tutorial interaction
 * @param {string} userId - User ID
 * @param {string} tutorialId - Tutorial ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function incrementViewCount(userId, tutorialId) {
  // First, get the current interaction
  const { data: existing, error: fetchError } = await getUserTutorialInteraction(userId, tutorialId)

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
    return { data: null, error: fetchError }
  }

  if (existing) {
    // Update existing interaction
    return updateUserTutorialInteraction(userId, tutorialId, {
      view_count: (existing.view_count || 0) + 1
    })
  } else {
    // Create new interaction with view_count = 1
    return upsertUserTutorialInteraction({
      user_id: userId,
      tutorial_id: tutorialId,
      view_count: 1
    })
  }
}

/**
 * Toggle saved status for a tutorial
 * @param {string} userId - User ID
 * @param {string} tutorialId - Tutorial ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function toggleSaved(userId, tutorialId) {
  const { data: existing, error: fetchError } = await getUserTutorialInteraction(userId, tutorialId)

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { data: null, error: fetchError }
  }

  const newSavedStatus = existing ? !existing.is_saved : true

  return upsertUserTutorialInteraction({
    user_id: userId,
    tutorial_id: tutorialId,
    is_saved: newSavedStatus
  })
}

/**
 * Toggle liked status for a tutorial
 * @param {string} userId - User ID
 * @param {string} tutorialId - Tutorial ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function toggleLiked(userId, tutorialId) {
  const { data: existing, error: fetchError } = await getUserTutorialInteraction(userId, tutorialId)

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { data: null, error: fetchError }
  }

  const newLikedStatus = existing ? !existing.is_liked : true

  return upsertUserTutorialInteraction({
    user_id: userId,
    tutorial_id: tutorialId,
    is_liked: newLikedStatus
  })
}

