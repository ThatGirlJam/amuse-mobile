'use client';

import { useState, useRef } from 'react';
import styles from './ImageUpload.module.css';

/**
 * ImageUpload Component
 *
 * Allows users to upload face images via:
 * - File selection
 * - Drag and drop
 * - Camera capture (mobile)
 */
export default function ImageUpload({ onImageSelect }) {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Allowed file types
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  /**
   * Validate uploaded file
   */
  const validateFile = (file) => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WEBP image';
    }

    // Check file size
    if (file.size > MAX_SIZE_BYTES) {
      return `Image size must be less than ${MAX_SIZE_MB}MB`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setPreview(null);
      return;
    }

    // Clear any previous errors
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Pass file to parent component
    if (onImageSelect) {
      onImageSelect(file);
    }
  };

  /**
   * Handle file input change
   */
  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /**
   * Handle drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  /**
   * Trigger file input click
   */
  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Trigger camera input click
   */
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  /**
   * Clear selected image
   */
  const handleClear = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (onImageSelect) {
      onImageSelect(null);
    }
  };

  /**
   * Handle keyboard navigation for upload area
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectClick();
    }
  };

  return (
    <div className={styles.container}>
      {/* Upload Area */}
      {!preview ? (
        <div
          className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label="Upload image area. Press Enter to select a file"
        >
          <div className={styles.uploadContent}>
            <div className={styles.uploadIcon}>📸</div>
            <h3>Upload Your Photo</h3>
            <p className={styles.uploadText}>
              Take a selfie or upload a front-facing photo for facial analysis
            </p>

            {/* Action Buttons */}
            <div className={styles.buttonGroup}>
              <button
                className={styles.primaryButton}
                onClick={handleCameraClick}
                type="button"
                aria-label="Take photo using camera"
              >
                📷 Take Photo
              </button>
              <button
                className={styles.secondaryButton}
                onClick={handleSelectClick}
                type="button"
                aria-label="Choose image file from device"
              >
                📁 Choose File
              </button>
            </div>

            <p className={styles.dragText}>or drag and drop an image here</p>
            <p className={styles.formatText}>
              Supported formats: JPEG, PNG, WEBP (Max {MAX_SIZE_MB}MB)
            </p>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleInputChange}
            className={styles.hiddenInput}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleInputChange}
            className={styles.hiddenInput}
          />
        </div>
      ) : (
        /* Preview Area */
        <div className={styles.previewArea} role="region" aria-label="Image preview">
          <div className={styles.previewHeader}>
            <h3>Selected Image</h3>
            <button
              className={styles.clearButton}
              onClick={handleClear}
              type="button"
              aria-label="Clear selected image and choose a different one"
            >
              ✕
            </button>
          </div>
          <div className={styles.previewImageContainer}>
            <img
              src={preview}
              alt="Selected facial image preview ready for analysis"
              className={styles.previewImage}
            />
          </div>
          <p className={styles.previewText}>
            Ready to analyze! Click &quot;Analyze&quot; to continue.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={styles.error} role="alert" aria-live="assertive">
          <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
