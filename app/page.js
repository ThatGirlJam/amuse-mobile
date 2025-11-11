'use client';

import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import styles from './page.module.css';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Handle image selection from upload component
   */
  const handleImageSelect = (file) => {
    setSelectedImage(file);
  };

  /**
   * Handle analyze button click
   * This will be connected to the API in Stage 8
   */
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);

    // TODO: Stage 8 - Connect to Python backend API
    // For now, just simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      alert('Analysis will be implemented in Stage 8!');
    }, 2000);
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
        {selectedImage && (
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
