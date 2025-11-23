'use client'

import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <h2 className={styles.greeting}>Hi, Welcome Back</h2>
        <button className={styles.searchButton}>
          <Image
            src="/images/search.png"
            alt="Search"
            width={24}
            height={24}
            className={styles.searchIcon}
          />
        </button>
      </div>
      <div className={styles.content}>
        <div className={styles.imageContainer}>
          <Image
            src="/images/onboarding_2.jpg"
            alt="Onboarding"
            fill
            className={styles.image}
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className={styles.textSection}>
          <h2 className={styles.header}>Facial Features</h2>
          <p className={styles.paragraph}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <br />
          <h2 className={styles.header}>Color Analysis</h2>
          <p className={styles.paragraph}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>
      </div>

      <nav className={styles.bottomNav}>
        <Link href="/home" className={styles.navItem}>
          <Image
            src="/images/home_selected.png"
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
        <Link href="/cart" className={styles.navItem}>
          <Image
            src="/images/cart.png"
            alt="Cart"
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

