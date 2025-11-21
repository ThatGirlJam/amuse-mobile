'use client'

import Link from 'next/link'
import styles from './page.module.css'

export default function ForgotPassword() {
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
          <form className={styles.form}>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.modalInput}
              placeholder="Enter your email"
            />
            <Link href="/reset-password" className={styles.nextButton}>Next</Link>
          </form>
        </div>
      </div>
    </main>
  )
}

