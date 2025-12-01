'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function Discounts() {
  const router = useRouter()

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <button 
          onClick={() => router.back()} 
          className={styles.backButton}
        >
          ←
        </button>
        <h2 className={styles.pageTitle}>Discounts & Offers</h2>
        <div className={styles.topBarRight}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏷️</div>
          <h3 className={styles.emptyTitle}>No Active Offers</h3>
          <p className={styles.emptyDescription}>
            Check back soon for exclusive deals and special offers!
          </p>
        </div>
      </div>

      <nav className={styles.bottomNav}>
        <Link href="/home" className={styles.navItem}>
          <Image
            src="/images/home.png"
            alt="Home"
            width={24}
            height={24}
            className={styles.navIcon}
          />
        </Link>
        <Link href="/made-for-you" className={styles.navItem}>
          <Image
            src="/images/categories.png"
            alt="Made For You"
            width={24}
            height={24}
            className={styles.navIcon}
          />
        </Link>
        <Link href="/saved" className={styles.navItem}>
          <Image
            src="/images/wishlist.png"
            alt="Saved"
            width={24}
            height={24}
            className={styles.navIcon}
          />
        </Link>
        <Link href="/community" className={styles.navItem}>
          <Image
            src="/images/cart.png"
            alt="Community"
            width={24}
            height={24}
            className={styles.navIcon}
          />
        </Link>
        <Link href="/profile" className={styles.navItem}>
          <Image
            src="/images/profile.png"
            alt="Profile"
            width={24}
            height={24}
            className={styles.navIcon}
          />
        </Link>
      </nav>
    </main>
  )
}

