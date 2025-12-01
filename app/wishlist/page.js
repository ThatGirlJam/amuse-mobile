'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth-client'
import styles from './page.module.css'

export default function Wishlist() {
  const router = useRouter()
  const [tutorials, setTutorials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  // Extract YouTube video ID from URL
  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  // Get YouTube thumbnail URL from video ID
  const getThumbnailUrl = (videoId) => {
    if (!videoId) return null
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  }

  useEffect(() => {
    async function fetchWishlist() {
      try {
        const session = await getSession()
        if (!session || !session.user) {
          router.push('/login?redirect=/wishlist')
          return
        }

        setUser(session.user)

        const response = await fetch(`/api/users/${session.user.id}/wishlist`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch wishlist')
        }

        const data = await response.json()
        
        // Format tutorials with thumbnails
        const formattedTutorials = (data.tutorials || []).map(tutorial => {
          const videoId = extractVideoId(tutorial.url)
          return {
            ...tutorial,
            thumbnail: getThumbnailUrl(videoId)
          }
        })
        
        setTutorials(formattedTutorials)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching wishlist:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchWishlist()
  }, [router])

  const handleTutorialClick = (url) => {
    window.open(url, '_blank')
  }

  const handleRemoveFromWishlist = async (e, tutorialId) => {
    e.stopPropagation()
    
    if (!user) return

    try {
      const response = await fetch(`/api/users/${user.id}/tutorials/${tutorialId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          is_saved: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist')
      }

      // Remove from local state
      setTutorials(tutorials.filter(t => t.tutorial_id !== tutorialId))
    } catch (err) {
      console.error('Error removing from wishlist:', err)
      alert('Failed to remove from wishlist. Please try again.')
    }
  }

  const getMatchReason = (matchedFeatures) => {
    if (!matchedFeatures) return 'Recommended for you'
    
    const reasons = []
    if (matchedFeatures.eye_shape) {
      reasons.push(`Your ${matchedFeatures.eye_shape} eyes`)
    }
    if (matchedFeatures.nose) {
      reasons.push(`Your ${matchedFeatures.nose} nose`)
    }
    if (matchedFeatures.lips) {
      reasons.push(`Your ${matchedFeatures.lips} lips`)
    }
    
    return reasons.length > 0 ? `Matches: ${reasons.join(', ')}` : 'Recommended for you'
  }

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}></div>
        <h2 className={styles.pageTitle}>Saved</h2>
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
        {loading ? (
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>Loading your saved tutorials...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
          </div>
        ) : tutorials.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No saved tutorials yet. Start saving tutorials you like!</p>
          </div>
        ) : (
          <div className={styles.tutorialsList}>
            {tutorials.map((tutorial) => (
              <div
                key={tutorial.tutorial_id}
                className={styles.tutorialCard}
                onClick={() => handleTutorialClick(tutorial.url)}
              >
                <div className={styles.cardImageContainer}>
                  {tutorial.thumbnail ? (
                    <Image
                      src={tutorial.thumbnail}
                      alt={tutorial.title}
                      fill
                      className={styles.cardImage}
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.cardImagePlaceholder} />
                  )}
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{tutorial.title}</h3>
                  <p className={styles.cardDescription}>
                    {tutorial.channel ? `By ${tutorial.channel}` : 'Makeup tutorial video'}
                  </p>
                  <div className={styles.cardFooter}>
                    <div className={styles.matchInfo}>
                      <Image
                        src="/images/link.png"
                        alt="Match"
                        width={16}
                        height={16}
                        className={styles.matchIcon}
                      />
                      <span className={styles.matchText}>{getMatchReason(tutorial.matched_features)}</span>
                    </div>
                    <button
                      className={styles.heartButton}
                      onClick={(e) => handleRemoveFromWishlist(e, tutorial.tutorial_id)}
                    >
                      <Image
                        src="/images/wishlist_selected.png"
                        alt="Remove from wishlist"
                        width={20}
                        height={20}
                        className={styles.heartIcon}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
            src="/images/wishlist_selected.png"
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

