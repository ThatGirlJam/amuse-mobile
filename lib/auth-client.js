/**
 * Client-side authentication utility functions
 */

const API_BASE = '/api/auth'

/**
 * Sign up a new user
 */
export async function signUp(userData) {
  const response = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Sign up failed')
  }

  return data
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  const response = await fetch(`${API_BASE}/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Important for cookies
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Sign in failed')
  }

  return data
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const response = await fetch(`${API_BASE}/signout`, {
    method: 'POST',
    credentials: 'include',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Sign out failed')
  }

  return data
}

/**
 * Get the current session
 */
export async function getSession() {
  const response = await fetch(`${API_BASE}/session`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get session')
  }

  return data
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  const response = await fetch(`${API_BASE}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send reset email')
  }

  return data
}

/**
 * Update user password
 * For password reset: extracts token from URL hash and uses it
 * For logged-in users: uses existing session
 */
export async function updatePassword(newPassword, tokenHash = null) {
  // If we're on the reset password page, try to extract token from URL hash
  if (typeof window !== 'undefined' && !tokenHash) {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      tokenHash = params.get('access_token') || params.get('token_hash')
    }
  }

  const response = await fetch(`${API_BASE}/update-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      new_password: newPassword,
      token_hash: tokenHash 
    }),
    credentials: 'include',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update password')
  }

  return data
}

/**
 * Initiate Google OAuth sign in
 */
export async function signInWithGoogle() {
  const response = await fetch(`${API_BASE}/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      redirectTo: `${window.location.origin}/api/auth/google/callback?next=/`,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to initiate Google sign in')
  }

  // Redirect to Google OAuth URL
  if (data.url) {
    window.location.href = data.url
  }

  return data
}

