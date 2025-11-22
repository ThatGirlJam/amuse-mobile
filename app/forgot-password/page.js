'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'
import { resetPassword } from '@/lib/auth-client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess(true)
      // Optionally redirect after a delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.')
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
        <h1 className={styles.title}>Forgot Password?</h1>
      </div>
      <div className={styles.container}>
        <div className={styles.contentSection}>
          <p className={styles.welcomeText}>Reset Password</p>
          <br />
          <p className={styles.placeholderText}>Enter your email address and we'll send you a link to reset your password!</p>
        </div>
        <div className={styles.modalSection}>
          <p className={styles.modalTitle}>Enter Your Email Address</p>
          <br />
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
              If an account with that email exists, a password reset link has been sent. Redirecting to login...
            </div>
          )}
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.modalInput}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || success}
            />
            <button 
              type="submit" 
              className={styles.nextButton}
              disabled={loading || success}
            >
              {loading ? 'Sending...' : success ? 'Sent!' : 'Next'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

