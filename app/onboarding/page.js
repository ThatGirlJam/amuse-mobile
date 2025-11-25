'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import styles from './page.module.css'
import { getSession } from '@/lib/auth-client'

export default function Onboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [cameraActive, setCameraActive] = useState(false)
  const [requestingCamera, setRequestingCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const initialStep = {
    title: "Welcome to",
    description: "Your one stop shop for beauty guidance. Let's get to it!"
  }

  const onboardingSteps = [
    {
      title: "Understanding You",
      description: "aMuse is a platform that provides beauty and makeup guidance personalized to you. In order to do so, we use our unique Facial Feature Recognition technology to detect your features and skin tone."
    },
    {
      title: "Facial Recognition",
      description: "As such, we require camera access (just for this one portion). Ready to be blown away?"
    },
    {
      title: "Analysis In Progress",
      description: "Your picture is undergoing thorough analysis..."
    },
    {
      title: "Analysis Complete",
      description: "Ready to know your unique beauty?"
    },
    {
      title: "Understand Your Beauty",
      description: "Here's the breakdown of your beauty:"
    }
  ]

  const startCamera = async () => {
    setRequestingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      streamRef.current = stream
      // Set camera active first so video element renders
      setCameraActive(true)
      setRequestingCamera(false)
    } catch (error) {
      console.error('Error accessing camera:', error)
      setRequestingCamera(false)
      setCameraActive(false)
      alert('Unable to access camera. Please ensure camera permissions are granted.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
    setRequestingCamera(false)
  }

  const capturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0)
      const imageDataUrl = canvas.toDataURL('image/png')
      setCapturedImage(imageDataUrl)
      stopCamera()
      // Clear any previous errors
      setAnalysisError(null)
      // Move to analysis step
      setCurrentStep(3)
    }
  }

  const nextStep = () => {
    if (currentStep === 2) {
      // On facial recognition step, start camera instead of moving to next step
      startCamera()
    } else if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      // Stop camera if it's active (going back from step 2 with camera active)
      if (cameraActive) {
        stopCamera()
      }
      setCurrentStep(currentStep - 1)
      // Clear captured image only if going back before the analysis step
      // Keep it for the last step (step 5) so it can be displayed
      if (currentStep === 3) {
        setCapturedImage(null)
      }
    }
  }

  // Set up video stream when camera becomes active
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current
      const stream = streamRef.current
      
      // Set the stream to video element
      video.srcObject = stream
      
      // Wait for video to be ready and play
      const setupVideo = async () => {
        try {
          // Wait for metadata to load
          if (video.readyState < 2) {
            await new Promise((resolve) => {
              const handleLoadedMetadata = () => {
                video.removeEventListener('loadedmetadata', handleLoadedMetadata)
                resolve()
              }
              video.addEventListener('loadedmetadata', handleLoadedMetadata)
              // Fallback timeout
              setTimeout(resolve, 2000)
            })
          }
          
          // Play the video
          await video.play()
        } catch (error) {
          console.error('Error setting up video:', error)
        }
      }
      
      setupVideo()
    }
  }, [cameraActive])

  // Keep video playing when camera is active
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current
      const stream = streamRef.current
      
      // Ensure video is playing and stream is active
      const ensurePlaying = async () => {
        // Check if stream is still active
        const activeTracks = stream.getVideoTracks().filter(track => track.readyState === 'live')
        if (activeTracks.length === 0) {
          console.warn('No active video tracks')
          return
        }
        
        // Ensure video element has the stream
        if (video.srcObject !== stream) {
          video.srcObject = stream
        }
        
        // Ensure video is playing
        if (video.paused) {
          try {
            await video.play()
          } catch (error) {
            console.error('Error playing video:', error)
          }
        }
      }
      
      // Set up interval to keep checking if video is playing
      const playInterval = setInterval(() => {
        if (videoRef.current && streamRef.current) {
          ensurePlaying()
        }
      }, 1000)
      
      // Handle video play events
      const handlePlay = () => {
        // Video is playing, good
      }
      
      const handlePause = () => {
        console.log('Video paused, attempting to resume')
        ensurePlaying()
      }
      
      const handleEnded = () => {
        console.log('Video ended, attempting to restart')
        ensurePlaying()
      }
      
      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)
      video.addEventListener('ended', handleEnded)
      
      return () => {
        clearInterval(playInterval)
        video.removeEventListener('play', handlePlay)
        video.removeEventListener('pause', handlePause)
        video.removeEventListener('ended', handleEnded)
      }
    }
  }, [cameraActive])

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession()
        if (!session || !session.user) {
          // User is not authenticated, redirect to login
          router.push('/login?redirect=/onboarding')
          return
        }
        setIsCheckingAuth(false)
      } catch (error) {
        console.error('Error checking authentication:', error)
        // If session check fails, redirect to login
        router.push('/login?redirect=/onboarding')
      }
    }

    checkAuth()
  }, [router])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const sliderIndex = currentStep > 0 
    ? currentStep === 3 ? 2 : currentStep === 4 ? 3 : currentStep - 1 
    : 0
  const isAnalysisStep = currentStep === 3

  // Handle image analysis when photo is captured
  useEffect(() => {
    if (isAnalysisStep && capturedImage) {
      setIsLoading(true)
      setAnalysisError(null)

      const analyzeImage = async () => {
        try {
          const response = await fetch('/api/onboarding/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              imageDataUrl: capturedImage
            })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || data.details || 'Failed to analyze image')
          }

          // Save analysis result
          setAnalysisResult(data.data)
          setIsLoading(false)
          // Move to completion step
          setCurrentStep(4)
        } catch (error) {
          console.error('Error analyzing image:', error)
          setAnalysisError(error.message || 'Failed to analyze image. Please try again.')
          setIsLoading(false)
          // Optionally go back to allow retry
          // setCurrentStep(2)
        }
      }

      analyzeImage()
    } else if (!isAnalysisStep) {
      setIsLoading(false)
    }
  }, [isAnalysisStep, capturedImage])

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div className={styles.spinner}></div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        {currentStep > 0 && (
          <button onClick={prevStep} className={styles.backButton}>
            ←
          </button>
        )}
      </div>
      
      <div className={`${styles.content} ${currentStep > 0 ? styles.contentBottom : ''}`}>
        <div className={styles.logoContainer}>
          <h1 className={styles.title}>
            {currentStep === 0 ? initialStep.title : onboardingSteps[currentStep - 1].title}
          </h1>
          {currentStep === 0 && (
            <>
              <Image
                src="/images/logo_dark_large_cropped.png"
                alt="Amuse"
                width={200}
                height={50}
                className={styles.logo}
                priority
              />
              <br />
            </>
          )}
          <p className={styles.description}>
            {currentStep === 0 ? initialStep.description : onboardingSteps[currentStep - 1].description}
          </p>
        </div>
      </div>

      <div className={`${styles.modalSection} ${currentStep > 0 ? styles.modalTop : ''} ${currentStep === 5 ? styles.modalStep5 : ''}`}>
        {requestingCamera ? (
          <div className={styles.cameraContainer}>
            <div className={styles.cameraLoading}>
              <div className={styles.spinner}></div>
              <p>Requesting camera access...</p>
            </div>
          </div>
        ) : cameraActive ? (
          <div className={styles.cameraContainer}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={styles.cameraVideo}
            />
            <button onClick={capturePhoto} className={styles.captureButton}>
              📷
            </button>
          </div>
        ) : currentStep === 5 && capturedImage ? (
          <div className={styles.capturedImageContainer}>
            <img
              src={capturedImage}
              alt="Your captured photo"
              className={styles.capturedImage}
            />
          </div>
        ) : (
          <Image
            src="/images/onboarding_1.jpg"
            alt="Onboarding"
            width={400}
            height={300}
            className={styles.modalImage}
          />
        )}
        {currentStep > 0 && !cameraActive && !requestingCamera && !(currentStep === 5 && capturedImage) && (
          <div className={styles.indicators}>
            {[0, 1, 2, 3].map((indicatorIndex) => {
              let isActive = false
              if (indicatorIndex === 0) {
                isActive = currentStep === 1
              } else if (indicatorIndex === 1) {
                isActive = currentStep === 2
              } else if (indicatorIndex === 2) {
                isActive = currentStep === 3 || currentStep === 4
              } else if (indicatorIndex === 3) {
                isActive = currentStep === 5
              }
              return (
                <div
                  key={indicatorIndex}
                  className={`${styles.indicator} ${isActive ? styles.active : ''}`}
                />
              )
            })}
          </div>
        )}

        {isAnalysisStep && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            {analysisError && (
              <p style={{ color: 'red', marginTop: '1rem' }}>{analysisError}</p>
            )}
          </div>
        )}

        {currentStep === 5 && analysisResult && (
          <div className={styles.breakdownContainer}>
            <h3 className={styles.breakdownTitle}>Feature Analysis</h3>
            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <span className={styles.featureLabel}>Eye Shape:</span>
                <span className={styles.featureValue}>
                  {analysisResult.features?.eye_shape || 'N/A'}
                  {analysisResult.full_analysis?.eye_analysis?.secondary_features?.length > 0 && (
                    <span className={styles.secondaryFeature}>
                      {' '}({analysisResult.full_analysis.eye_analysis.secondary_features.join(', ')})
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureLabel}>Nose:</span>
                <span className={styles.featureValue}>
                  {analysisResult.features?.nose || 'N/A'}
                </span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureLabel}>Lips:</span>
                <span className={styles.featureValue}>
                  {analysisResult.features?.lips || 'N/A'}
                </span>
              </div>
            </div>
            
            {analysisResult.full_analysis?.eye_analysis?.confidence_scores && (
              <div className={styles.topScoresContainer}>
                <h4 className={styles.topScoresTitle}>Top Eye Shape Scores</h4>
                <div className={styles.scoresList}>
                  {Object.entries(analysisResult.full_analysis.eye_analysis.confidence_scores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([shape, score]) => (
                      <div key={shape} className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>{shape}:</span>
                        <span className={styles.scoreValue}>
                          {(score * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {analysisResult.full_analysis?.nose_analysis && (
              <div className={styles.topScoresContainer}>
                <h4 className={styles.topScoresTitle}>Top Nose Width Scores</h4>
                <div className={styles.scoresList}>
                  <div className={styles.scoreItem}>
                    <span className={styles.scoreLabel}>
                      {analysisResult.full_analysis.nose_analysis.nose_width || 'N/A'}:
                    </span>
                    <span className={styles.scoreValue}>
                      {analysisResult.full_analysis.nose_analysis.confidence 
                        ? (analysisResult.full_analysis.nose_analysis.confidence * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {analysisResult.full_analysis?.lip_analysis && (
              <div className={styles.topScoresContainer}>
                <h4 className={styles.topScoresTitle}>Top Lip Fullness Scores</h4>
                <div className={styles.scoresList}>
                  <div className={styles.scoreItem}>
                    <span className={styles.scoreLabel}>
                      {analysisResult.full_analysis.lip_analysis.lip_fullness || 'N/A'}:
                    </span>
                    <span className={styles.scoreValue}>
                      {analysisResult.full_analysis.lip_analysis.confidence 
                        ? (analysisResult.full_analysis.lip_analysis.confidence * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.buttonContainer}>
          {currentStep === 0 ? (
            <button onClick={nextStep} className={styles.nextButton}>
              Get Started
            </button>
          ) : requestingCamera ? (
            <button className={`${styles.nextButton} ${styles.nextButtonDisabled}`} disabled>
              Requesting Access...
            </button>
          ) : cameraActive ? (
            <button onClick={stopCamera} className={styles.cancelButton}>
              Cancel
            </button>
          ) : isAnalysisStep ? (
            <button className={`${styles.nextButton} ${styles.nextButtonDisabled}`} disabled>
              Analyzing...
            </button>
          ) : currentStep < onboardingSteps.length ? (
            <button onClick={nextStep} className={styles.nextButton}>
              Next
            </button>
          ) : (
            <Link href="/home" className={styles.nextButton}>
              Finish
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}

