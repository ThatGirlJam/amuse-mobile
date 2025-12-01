'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getSession } from '@/lib/auth-client'
import styles from './page.module.css'

export default function MadeForYou() {
  const [tutorials, setTutorials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingText, setLoadingText] = useState(0)
  const [user, setUser] = useState(null)
  const [savedTutorials, setSavedTutorials] = useState(new Set())

  const loadingMessages = [
    'Finding the perfect tutorials for you...',
    'Discovering tutorials tailored just for you...',
    'Finding your personalized recommendations...', 
    'Matching you with the perfect makeup guides...'
  ]

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

  // Format matched features into a readable "why it matches" string
  const formatMatchReason = (matchedFeatures, userFeatures) => {
    if (!matchedFeatures || matchedFeatures.length === 0) {
      return 'Recommended for you'
    }

    const reasons = []
    const lowerMatched = matchedFeatures.map(m => m.toLowerCase())

    // Map matched features to user features
    for (const matched of lowerMatched) {
      if (matched.includes('eye') && userFeatures.eye_shape) {
        reasons.push(`Your ${userFeatures.eye_shape} eyes`)
      } else if (matched.includes('nose') && userFeatures.nose) {
        reasons.push(`Your ${userFeatures.nose} nose`)
      } else if (matched.includes('lip') && userFeatures.lips) {
        reasons.push(`Your ${userFeatures.lips} lips`)
      }
    }

    if (reasons.length === 0) {
      return 'Recommended for you'
    }

    return `Matches: ${reasons.join(', ')}`
  }

  useEffect(() => {
    async function fetchTutorials() {
      try {
        setLoading(true)
        
        // Get user session and features
        let sessionData
        try {
          sessionData = await getSession()
        } catch (sessionError) {
          console.error('Session error:', sessionError)
          setError('Please log in to see personalized recommendations.')
          setLoading(false)
          return
        }
        
        const currentUser = sessionData?.user
        setUser(currentUser)
        
        if (!currentUser || !currentUser.id) {
          setError('Please log in to see personalized recommendations.')
          setLoading(false)
          return
        }

        // Get user's feature analysis
        const featuresResponse = await fetch(`/api/users/${currentUser.id}/features`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!featuresResponse.ok) {
          if (featuresResponse.status === 404) {
            setError('Complete onboarding to get personalized recommendations.')
          } else {
            throw new Error('Failed to fetch user features')
          }
          setLoading(false)
          return
        }

        const featureData = await featuresResponse.json()
        if (!featureData.eye_shape && !featureData.nose && !featureData.lips) {
          setError('Complete onboarding to get personalized recommendations.')
          setLoading(false)
          return
        }

        // Search for tutorials using the existing search endpoint
        const searchResponse = await fetch('/api/tutorials/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            user_id: currentUser.id,
            eye_shape: featureData.eye_shape,
            nose: featureData.nose,
            lips: featureData.lips,
            max_results: 10,
            force_refresh: false
          })
        })

        // Fetch user's saved tutorials to show correct icon state
        try {
          const wishlistResponse = await fetch(`/api/users/${currentUser.id}/wishlist`, {
            method: 'GET',
            credentials: 'include',
          })
          if (wishlistResponse.ok) {
            const wishlistData = await wishlistResponse.json()
            const savedIds = new Set((wishlistData.tutorials || []).map(t => t.tutorial_id))
            setSavedTutorials(savedIds)
          }
        } catch (wishlistError) {
          console.error('Error fetching wishlist:', wishlistError)
          // Continue even if wishlist fetch fails
        }

        if (!searchResponse.ok) {
          throw new Error('Failed to fetch tutorials')
        }

        const searchData = await searchResponse.json()
        
        // Format results with thumbnails and match reasons
        const formattedTutorials = (searchData.results || []).map(tutorial => {
          const videoId = extractVideoId(tutorial.url)
          const userFeatures = {
            eye_shape: featureData.eye_shape,
            nose: featureData.nose,
            lips: featureData.lips
          }
          
          return {
            ...tutorial,
            thumbnail: getThumbnailUrl(videoId),
            match_reason: formatMatchReason(tutorial.matched_features, userFeatures)
          }
        })

        setTutorials(formattedTutorials)
      } catch (error) {
        console.error('Error fetching tutorials:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTutorials()
  }, [])

  // Cycle through loading messages
  useEffect(() => {
    if (!loading) return

    const interval = setInterval(() => {
      setLoadingText((prev) => (prev + 1) % loadingMessages.length)
    }, 2000) // Change message every 2 seconds

    return () => clearInterval(interval)
  }, [loading, loadingMessages.length])

  const handleTutorialClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleWishlistToggle = async (e, tutorialId) => {
    e.stopPropagation()
    
    if (!user?.id || !tutorialId) return

    const isCurrentlySaved = savedTutorials.has(tutorialId)
    const newSavedState = !isCurrentlySaved

    try {
      const response = await fetch(`/api/users/${user.id}/tutorials/${tutorialId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          is_saved: newSavedState
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update wishlist')
      }

      // Update local state
      const newSavedTutorials = new Set(savedTutorials)
      if (newSavedState) {
        newSavedTutorials.add(tutorialId)
      } else {
        newSavedTutorials.delete(tutorialId)
      }
      setSavedTutorials(newSavedTutorials)
    } catch (err) {
      console.error('Error updating wishlist:', err)
      alert('Failed to update wishlist. Please try again.')
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}></div>
        <h2 className={styles.pageTitle}>Made For You</h2>
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
            <p className={styles.loadingText}>{loadingMessages[loadingText]}</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
          </div>
        ) : tutorials.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No tutorials found. Complete onboarding to get personalized recommendations.</p>
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
                    {tutorial.description || 'Makeup tutorial video'}
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
                      <span className={styles.matchText}>{tutorial.match_reason}</span>
                    </div>
                    <button
                      className={styles.heartButton}
                      onClick={(e) => handleWishlistToggle(e, tutorial.tutorial_id)}
                    >
                      <Image
                        src={savedTutorials.has(tutorial.tutorial_id) ? "/images/wishlist_selected.png" : "/images/wishlist.png"}
                        alt={savedTutorials.has(tutorial.tutorial_id) ? "Remove from wishlist" : "Add to wishlist"}
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
            src="/images/categories_selected.png"
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

