'use client';

import { useState, useRef } from 'react';
import ImageUpload from './components/ImageUpload';
import ResultsDisplay from './components/ResultsDisplay';
import { analyzeFace } from '../lib/api';
import styles from './page.module.css';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);

  /**
   * Handle image selection from upload component
   */
  const handleImageSelect = (file) => {
    setSelectedImage(file);
    // Clear previous results and errors when new image is selected
    setAnalysisResult(null);
    setError(null);
  };

  /**
   * Get user-friendly error message based on error type
   */
  const getErrorDetails = (err) => {
    const errorType = err.type || 'UNKNOWN_ERROR';

    const errorMap = {
      NO_FACE_DETECTED: {
        title: 'No Face Detected',
        message: 'We couldn\'t detect a face in your image. Please ensure your photo clearly shows your face, similar to a passport photo.',
        icon: '🤷'
      },
      MULTIPLE_FACES: {
        title: 'Multiple Faces Detected',
        message: 'We detected multiple faces in your image. Please upload a photo with only your face visible.',
        icon: '👥'
      },
      INVALID_IMAGE: {
        title: 'Invalid Image',
        message: 'The image you uploaded appears to be invalid or corrupted. Please try a different image.',
        icon: '🖼️'
      },
      FILE_TOO_LARGE: {
        title: 'File Too Large',
        message: 'Your image file is too large. Please upload an image smaller than 10MB.',
        icon: '📦'
      },
      UNSUPPORTED_FORMAT: {
        title: 'Unsupported Format',
        message: 'This file format is not supported. Please upload a JPEG, PNG, or WebP image.',
        icon: '❌'
      },
      NETWORK_ERROR: {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check that the backend is running and try again.',
        icon: '🔌'
      },
      TIMEOUT_ERROR: {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again with a smaller image.',
        icon: '⏱️'
      },
      SERVER_ERROR: {
        title: 'Server Error',
        message: 'The server encountered an error while processing your request. Please try again later.',
        icon: '🚨'
      },
      UNKNOWN_ERROR: {
        title: 'Analysis Failed',
        message: err.message || 'An unexpected error occurred. Please try again.',
        icon: '⚠️'
      }
    };

    return errorMap[errorType] || errorMap.UNKNOWN_ERROR;
  };

  /**
   * Handle analyze button click
   * Sends image to Python backend for facial analysis
   */
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Call Python backend API
      const result = await analyzeFace(selectedImage, true);

      // Store results for display
      setAnalysisResult(result);

      console.log('Analysis successful:', result);
    } catch (err) {
      // Handle errors with detailed messages
      const errorDetails = getErrorDetails(err);
      setError(errorDetails);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Scroll to results section
   */
  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Amuse</h1>
          <p className={styles.subtitle}>
            Discover Your Perfect Makeup Style
          </p>
          <p className={styles.description}>
            Upload a photo and get personalized makeup recommendations based on your unique facial features
          </p>
        </header>

        {/* Upload Section */}
        <section className={styles.uploadSection}>
          <ImageUpload onImageSelect={handleImageSelect} />
        </section>

        {/* Analyze Button */}
        {selectedImage && !analysisResult && (
          <section className={styles.actionSection}>
            <button
              className={styles.analyzeButton}
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              aria-label="Analyze facial features"
              aria-busy={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <span className={styles.spinner} aria-hidden="true"></span>
                  Analyzing...
                </>
              ) : (
                'Analyze My Features'
              )}
            </button>
          </section>
        )}

        {/* Loading Skeleton */}
        {isAnalyzing && (
          <section className={styles.loadingSection} aria-label="Analysis in progress">
            <div className={styles.loadingSkeleton}>
              <div className={styles.skeletonHeader}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonText}></div>
              </div>
              <div className={styles.skeletonCards}>
                <div className={styles.skeletonCard}></div>
                <div className={styles.skeletonCard}></div>
                <div className={styles.skeletonCard}></div>
              </div>
              <div className={styles.loadingMessage}>
                <span className={styles.loadingIcon}>🔍</span>
                <p>Analyzing your facial features...</p>
                <span className={styles.loadingSubtext}>This may take a few seconds</span>
              </div>
            </div>
          </section>
        )}

        {/* Error Message */}
        {error && (
          <section className={styles.messageSection} role="alert" aria-live="assertive">
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon} aria-hidden="true">{error.icon}</span>
              <div>
                <h3>{error.title}</h3>
                <p>{error.message}</p>
                <button
                  className={styles.retryButton}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  aria-label="Retry facial analysis"
                >
                  {isAnalyzing ? 'Retrying...' : 'Try Again'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Success Message */}
        {analysisResult && !error && (
          <section className={styles.messageSection} role="status" aria-live="polite">
            <div className={styles.successMessage}>
              <span className={styles.successIcon} aria-hidden="true">✅</span>
              <div>
                <h3>Analysis Complete!</h3>
                <p>Your facial features have been analyzed successfully.</p>
                <p className={styles.resultPreview}>
                  {analysisResult.data?.summary?.description}
                </p>
                <div className={styles.messageActions}>
                  <button
                    className={styles.viewResultsButton}
                    onClick={scrollToResults}
                    aria-label="View detailed analysis results"
                  >
                    View Results
                  </button>
                  <button
                    className={styles.newAnalysisButton}
                    onClick={() => {
                      setSelectedImage(null);
                      setAnalysisResult(null);
                      setError(null);
                    }}
                    aria-label="Start a new facial analysis"
                  >
                    New Analysis
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Results Display */}
        {analysisResult && !error && (
          <section ref={resultsRef} className={styles.resultsSection}>
            <ResultsDisplay result={analysisResult} />
          </section>
        )}

        {/* Info Section */}
        <section className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>👁️</div>
              <h3>Eye Shape Analysis</h3>
              <p>Identifies your eye shape and best eyeliner techniques</p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>👃</div>
              <h3>Nose Contour</h3>
              <p>Determines optimal contouring for your nose structure</p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>💋</div>
              <h3>Lip Enhancement</h3>
              <p>Suggests lip techniques to complement your features</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>Powered by AI facial analysis</p>
        </footer>
      </div>
    </main>
  );
}
