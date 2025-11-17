import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'

export default function InitialPage() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <Image
          src="/images/logo_dark_large.png"
          alt="Amuse"
          width={200}
          height={50}
          className={styles.logo}
          priority
        />
        <div className={styles.buttonContainer}>
          <Link href="/login" className={styles.loginButton}>Log In</Link>
          <Link href="/signup" className={styles.signUpButton}>Sign Up</Link>
        </div>
      </div>
    </main>
  )
}

