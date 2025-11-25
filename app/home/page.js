'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getSession } from '@/lib/auth-client'
import styles from './page.module.css'

export default function Home() {
  const [profilePictureUrl, setProfilePictureUrl] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [featureAnalysis, setFeatureAnalysis] = useState(null)

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { user } = await getSession()
        if (user?.profile_picture_url) {
          setProfilePictureUrl(user.profile_picture_url)
        } else {
          setProfilePictureUrl('/images/onboarding_2.jpg')
        }

        // Fetch feature analysis if user exists
        if (user?.id) {
          try {
            const response = await fetch(`/api/users/${user.id}/features`, {
              method: 'GET',
              credentials: 'include',
            })
            if (response.ok) {
              const data = await response.json()
              setFeatureAnalysis(data)
            }
          } catch (error) {
            console.error('Error fetching feature analysis:', error)
          }
        }
      } catch (error) {
        console.error('Error fetching user session:', error)
        // Use default image on error
        setProfilePictureUrl('/images/onboarding_2.jpg')
      }
    }

    fetchUserProfile()
  }, [])

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true)
      setProfilePictureUrl('/images/onboarding_2.jpg')
    }
  }

  const formatFeatureValue = (value) => {
    if (!value || value === 'unknown') return 'Unknown'
    // Capitalize first letter and replace underscores with spaces
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Check if URL is external (starts with http:// or https://)
  const isExternalUrl = profilePictureUrl?.startsWith('http://') || profilePictureUrl?.startsWith('https://')

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
        {profilePictureUrl ? (
          <>
            <div className={styles.imageContainer}>
              <Image
                src={profilePictureUrl}
                alt="Profile"
                fill
                className={styles.image}
                style={{ objectFit: 'cover' }}
                onError={handleImageError}
                unoptimized={isExternalUrl}
              />
            </div>
            <div className={styles.textSection}>
              <h2 className={styles.header}>Facial Features</h2>
              {featureAnalysis ? (
                <div className={styles.featuresList}>
                  <div className={styles.featureItem}>
                    <span className={styles.featureLabel}>Eye Shape:</span>
                    <span className={styles.featureValue}>{formatFeatureValue(featureAnalysis.eye_shape)}</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureLabel}>Nose:</span>
                    <span className={styles.featureValue}>{formatFeatureValue(featureAnalysis.nose)}</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureLabel}>Lips:</span>
                    <span className={styles.featureValue}>{formatFeatureValue(featureAnalysis.lips)}</span>
                  </div>
                </div>
              ) : (
                <p className={styles.paragraph}>No analysis available</p>
              )}
              <br />
              <h2 className={styles.header}>Color Analysis</h2>
              <p className={styles.paragraph}>In the works...</p>
            </div>
          </>
        ) : (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        )}
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

