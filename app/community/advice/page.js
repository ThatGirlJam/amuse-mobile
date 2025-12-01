'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function Advice() {
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState('General')
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(true)

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <button 
          onClick={() => router.back()} 
          className={styles.backButton}
        >
          ←
        </button>
        <h2 className={styles.pageTitle}>Advice & Guidance</h2>
        <button className={styles.searchButton}>
          <span className={styles.searchIconText}>Q</span>
        </button>
      </div>

      <div className={styles.content}>
        {/* Ask A Peer Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Ask A Peer</h3>
          
          <div className={styles.filters}>
            <button
              className={`${styles.filterButton} ${selectedFilter === 'General' ? styles.filterButtonActive : ''}`}
              onClick={() => setSelectedFilter('General')}
            >
              General
            </button>
            <button
              className={`${styles.filterButton} ${selectedFilter === 'Beginner' ? styles.filterButtonActive : ''}`}
              onClick={() => setSelectedFilter('Beginner')}
            >
              Beginner
            </button>
            <button
              className={`${styles.filterButton} ${selectedFilter === 'Products' ? styles.filterButtonActive : ''}`}
              onClick={() => setSelectedFilter('Products')}
            >
              Products
            </button>
          </div>

          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search"
              className={styles.searchInput}
            />
            <button className={styles.filterIconButton}>
              <span className={styles.filterIcon}>☰</span>
            </button>
          </div>

          <div className={styles.questionCard}>
            <button
              className={styles.questionHeader}
              onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
            >
              <span className={styles.questionText}>What order to put on makeup?</span>
              <span className={styles.chevron}>{isQuestionExpanded ? '▼' : '▶'}</span>
            </button>
            
            {isQuestionExpanded && (
              <div className={styles.questionContent}>
                <p className={styles.answerText}>
                  Based on user responses, the most common way to put on makeup is first with foundation, followed by coverage with concealer or a color corrector. This is then followed by loose powder to...
                </p>
                
                <div className={styles.chatBubbles}>
                  <div className={`${styles.chatBubble} ${styles.chatBubblePeer}`}>
                    I like to start off with foundation and then...
                  </div>
                  <div className={`${styles.chatBubble} ${styles.chatBubbleUser}`}>
                    Honestly I don't like foundation, so I put on...
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Ask A Professional Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Ask A Professional</h3>
          
          <div className={styles.professionalChat}>
            <div className={`${styles.chatBubble} ${styles.chatBubbleProfessional}`}>
              <p className={styles.chatBubbleText}>Of course, we can find the perfect lipstick for you. Do you have a particular style in mind or any color preferences?</p>
              <span className={styles.timestamp}>14:01</span>
            </div>
            
            <div className={`${styles.chatBubble} ${styles.chatBubbleUser}`}>
              <p className={styles.chatBubbleText}>I'd like something in neutral tones, perhaps dark pink, and with a cute makeup style.</p>
              <span className={styles.timestamp}>14:02</span>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Input Bar */}
      <div className={styles.inputBar}>
        <button className={styles.inputIconButton}>
          <span className={styles.cameraIcon}>📷</span>
        </button>
        <input
          type="text"
          placeholder="Write Here..."
          className={styles.textInput}
        />
        <button className={styles.inputIconButton}>
          <span className={styles.micIcon}>🎤</span>
        </button>
        <button className={styles.sendButton}>
          <span className={styles.sendIcon}>✈</span>
        </button>
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

