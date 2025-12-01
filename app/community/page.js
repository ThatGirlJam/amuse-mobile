'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function Community() {
  const router = useRouter()

  const communityCards = [
    {
      id: 'discounts',
      title: 'Discounts & Offers',
      icon: '🏷️',
      href: '/community/discounts',
      description: 'Exclusive deals and special offers'
    },
    {
      id: 'advice',
      title: 'Advice & Guidance',
      icon: '💬',
      href: '/community/advice',
      description: 'Get expert beauty tips and advice'
    },
    {
      id: 'reviews',
      title: 'Honest Reviews',
      icon: '👁️',
      href: '/community/reviews',
      description: 'Real reviews from the community'
    },
    {
      id: 'comparison',
      title: 'Comparison Guide',
      icon: '⚖️',
      href: '/community/comparison',
      description: 'Compare products and tutorials'
    }
  ]

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <button 
          onClick={() => router.back()} 
          className={styles.backButton}
        >
          ←
        </button>
        <h2 className={styles.pageTitle}>Community</h2>
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
        <div className={styles.cardsGrid}>
          {communityCards.map((card) => (
            <Link 
              key={card.id} 
              href={card.href} 
              className={styles.card}
            >
              <div className={styles.cardIcon}>{card.icon}</div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDescription}>{card.description}</p>
            </Link>
          ))}
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
            src="/images/cart_selected.png"
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

