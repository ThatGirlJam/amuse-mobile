'use client'

import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'

export default function Profile() {

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}></div>
        <h2 className={styles.pageTitle}>My Profile</h2>
        <button className={styles.editButton}>
          <Image
            src="/images/edit_profile.png"
            alt="Edit Profile"
            width={24}
            height={24}
            className={styles.editIcon}
          />
        </button>
      </div>
      <div className={styles.content}>
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
        <Link href="/categories" className={styles.navItem}>
          <Image
            src="/images/categories.png"
            alt="Categories"
            width={24}
            height={24}
            className={styles.navIcon}
          />
        </Link>
        <Link href="/wishlist" className={styles.navItem}>
          <Image
            src="/images/wishlist.png"
            alt="Wishlist"
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
            src="/images/profile_selected.png"
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

