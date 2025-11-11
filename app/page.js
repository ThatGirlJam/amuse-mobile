'use client';

import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import { analyzeFace } from '../lib/api';
import styles from './page.module.css';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

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

      // Store results for display in Stage 9
      setAnalysisResult(result);

      console.log('Analysis successful:', result);
    } catch (err) {
      // Handle errors
      setError(err.message || 'Failed to analyze image. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
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
            >
              {isAnalyzing ? (
                <>
                  <span className={styles.spinner}></span>
                  Analyzing...
                </>
              ) : (
                'Analyze My Features'
              )}
            </button>
          </section>
        )}

        {/* Error Message */}
        {error && (
          <section className={styles.messageSection}>
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              <div>
                <h3>Analysis Failed</h3>
                <p>{error}</p>
                <button
                  className={styles.retryButton}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  Try Again
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Success Message */}
        {analysisResult && !error && (
          <section className={styles.messageSection}>
            <div className={styles.successMessage}>
              <span className={styles.successIcon}>✅</span>
              <div>
                <h3>Analysis Complete!</h3>
                <p>Your facial features have been analyzed successfully.</p>
                <p className={styles.resultPreview}>
                  {analysisResult.data?.summary?.description}
                </p>
                <div className={styles.messageActions}>
                  <button
                    className={styles.viewResultsButton}
                    onClick={() => {
                      // Stage 9: This will scroll to results display
                      console.log('View results:', analysisResult);
                    }}
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
                  >
                    New Analysis
                  </button>
                </div>
              </div>
            </div>
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
