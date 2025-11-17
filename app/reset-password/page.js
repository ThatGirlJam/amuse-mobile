'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
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
        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className={styles.input}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={styles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className={styles.passwordToggle}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <span className="material-icons">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>
          <br />
          <button type="submit" className={styles.submitButton}>Reset Password</button>
        </form>
      </div>
    </main>
  )
}

