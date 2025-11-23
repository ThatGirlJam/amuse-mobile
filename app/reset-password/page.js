'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'
import { updatePassword } from '@/lib/auth-client'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle password reset token from URL hash (Supabase sends it in the hash)
  useEffect(() => {
    const handleResetToken = async () => {
      try {
        // Check if we have a token in the URL hash
        const hash = window.location.hash
        if (hash) {
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const type = params.get('type')
          
          if (accessToken && type === 'recovery') {
            // Exchange the token for a session
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: params.get('refresh_token') || ''
            })

            if (error) {
              setError('Invalid or expired reset link. Please request a new password reset.')
              setInitializing(false)
              return
            }

            // Session is now set, we can proceed
            setInitializing(false)
          } else {
            setInitializing(false)
          }
        } else {
          // Check query params as fallback
          const tokenHash = searchParams.get('token_hash')
          if (tokenHash) {
            setInitializing(false)
          } else {
            setError('No password reset token found. Please use the link from your email.')
            setInitializing(false)
          }
        }
      } catch (err) {
        setError('Failed to process reset link. Please try again.')
        setInitializing(false)
      }
    }

    handleResetToken()
  }, [searchParams])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      // Check if we have a session (from the token exchange in useEffect)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Try to extract token from URL hash and exchange it
        const hash = window.location.hash
        if (hash) {
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          
          if (accessToken && refreshToken) {
            // Exchange token for session
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (sessionError || !data.session) {
              throw new Error('Invalid or expired reset link. Please request a new password reset.')
            }
          } else {
            throw new Error('No valid reset token found. Please use the link from your email.')
          }
        } else {
          throw new Error('No valid reset token found. Please use the link from your email.')
        }
      }

      // Now update the password using Supabase client directly
      // This works because we have a session from the reset token
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess(true)
      
      // Sign out to clear the temporary session
      await supabase.auth.signOut()
      
      // Redirect to login after successful password reset
      setTimeout(() => {
        router.push('/login?password_reset=success')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <Link href="/login" className={styles.backButton}>
          ←
        </Link>
        <h1 className={styles.title}>Set Your Password</h1>
      </div>
      <div className={styles.container}>
        <p className={styles.welcomeText}>Change Your Password</p>
        <br />
        <p className={styles.placeholderText}>Reset your password here.</p>
        <br />
        {initializing && (
          <div style={{ 
            color: 'blue', 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#eef', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            Verifying reset link...
          </div>
        )}
        {error && (
          <div style={{ 
            color: 'red', 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#fee', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ 
            color: 'green', 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#efe', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            Password updated successfully! Redirecting to login...
          </div>
        )}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className={styles.input}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || success || initializing}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={styles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading || success || initializing}
              >
                <span className="material-icons">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                className={styles.input}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || success || initializing}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className={styles.passwordToggle}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                disabled={loading || success || initializing}
              >
                <span className="material-icons">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>
          <br />
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || success}
          >
            {loading ? 'Updating...' : success ? 'Updated!' : 'Reset Password'}
          </button>
        </form>
      </div>
    </main>
  )
}

