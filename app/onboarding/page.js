'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './page.module.css'

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

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

  const nextStep = () => {
    if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const sliderIndex = currentStep > 0 
    ? currentStep === 3 ? 2 : currentStep === 4 ? 3 : currentStep - 1 
    : 0
  const isAnalysisStep = currentStep === 3

  useEffect(() => {
    if (isAnalysisStep) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
        setCurrentStep(4)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setIsLoading(false)
    }
  }, [isAnalysisStep])

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

      <div className={`${styles.modalSection} ${currentStep > 0 ? styles.modalTop : ''}`}>
        <Image
          src="/images/onboarding_1.jpg"
          alt="Onboarding"
          width={400}
          height={300}
          className={styles.modalImage}
        />
        {currentStep > 0 && (
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
          </div>
        )}

        <div className={styles.buttonContainer}>
          {currentStep === 0 ? (
            <button onClick={nextStep} className={styles.nextButton}>
              Get Started
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

