'use client';

import styles from './ResultsDisplay.module.css';

/**
 * ResultsDisplay Component
 *
 * Displays comprehensive facial analysis results including:
 * - Eye shape classification
 * - Nose width analysis
 * - Lip fullness assessment
 * - Confidence scores and measurements
 * - YouTube search tags for makeup tutorials
 */
export default function ResultsDisplay({ result }) {
  if (!result || !result.data) {
    return null;
  }

  const { data } = result;
  const { eye_shape, nose_width, lip_fullness, summary } = data;

  return (
    <div className={styles.resultsContainer} role="region" aria-label="Facial analysis results">
      {/* Header Section */}
      <div className={styles.resultsHeader}>
        <h2 className={styles.resultsTitle}>Your Facial Analysis</h2>
        <p className={styles.resultsDescription}>
          {summary?.description}
        </p>
      </div>

      {/* Feature Analysis Grid */}
      <div className={styles.featuresGrid} role="list" aria-label="Facial features analysis">
        {/* Eye Shape Card */}
        <div className={styles.featureCard} role="listitem" aria-label="Eye shape analysis">
          <div className={styles.featureIcon} aria-hidden="true">👁️</div>
          <h3 className={styles.featureTitle}>Eye Shape</h3>
          <div className={styles.featureClassification}>
            {eye_shape?.classification}
          </div>
          <div className={styles.confidenceBar}>
            <div className={styles.confidenceLabel}>
              <span>Confidence</span>
              <span className={styles.confidenceValue}>
                {(eye_shape?.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuenow={eye_shape?.confidence * 100}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Eye shape classification confidence"
            >
              <div
                className={styles.progressFill}
                style={{ width: `${eye_shape?.confidence * 100}%` }}
              ></div>
            </div>
          </div>
          {eye_shape?.details && (
            <div className={styles.featureDetails}>
              <h4>Measurements</h4>
              <ul>
                <li>Aspect Ratio: {eye_shape.details.aspect_ratio?.toFixed(3)}</li>
                {eye_shape.details.eyelid_coverage !== undefined && (
                  <li>Eyelid Coverage: {(eye_shape.details.eyelid_coverage * 100).toFixed(1)}%</li>
                )}
                {eye_shape.details.corner_angle !== undefined && (
                  <li>Corner Angle: {eye_shape.details.corner_angle?.toFixed(1)}°</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Nose Width Card */}
        <div className={styles.featureCard} role="listitem" aria-label="Nose width analysis">
          <div className={styles.featureIcon} aria-hidden="true">👃</div>
          <h3 className={styles.featureTitle}>Nose Width</h3>
          <div className={styles.featureClassification}>
            {nose_width?.classification}
          </div>
          <div className={styles.confidenceBar}>
            <div className={styles.confidenceLabel}>
              <span>Confidence</span>
              <span className={styles.confidenceValue}>
                {(nose_width?.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuenow={nose_width?.confidence * 100}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Nose width classification confidence"
            >
              <div
                className={styles.progressFill}
                style={{ width: `${nose_width?.confidence * 100}%` }}
              ></div>
            </div>
          </div>
          {nose_width?.details && (
            <div className={styles.featureDetails}>
              <h4>Measurements</h4>
              <ul>
                <li>Nose-to-Face Ratio: {nose_width.details.nose_to_face_ratio?.toFixed(3)}</li>
                {nose_width.details.nose_width_mm !== undefined && (
                  <li>Nose Width: {nose_width.details.nose_width_mm?.toFixed(1)}mm</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Lip Fullness Card */}
        <div className={styles.featureCard} role="listitem" aria-label="Lip fullness analysis">
          <div className={styles.featureIcon} aria-hidden="true">💋</div>
          <h3 className={styles.featureTitle}>Lip Fullness</h3>
          <div className={styles.featureClassification}>
            {lip_fullness?.classification}
          </div>
          <div className={styles.confidenceBar}>
            <div className={styles.confidenceLabel}>
              <span>Confidence</span>
              <span className={styles.confidenceValue}>
                {(lip_fullness?.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuenow={lip_fullness?.confidence * 100}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Lip fullness classification confidence"
            >
              <div
                className={styles.progressFill}
                style={{ width: `${lip_fullness?.confidence * 100}%` }}
              ></div>
            </div>
          </div>
          {lip_fullness?.details && (
            <div className={styles.featureDetails}>
              <h4>Measurements</h4>
              <ul>
                <li>Height-to-Width Ratio: {lip_fullness.details.height_to_width_ratio?.toFixed(3)}</li>
                {lip_fullness.details.balance && (
                  <li>Balance: {lip_fullness.details.balance}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* YouTube Search Tags Section */}
      {summary?.youtube_tags && summary.youtube_tags.length > 0 && (
        <div className={styles.tagsSection}>
          <h3 className={styles.tagsTitle}>Recommended Makeup Searches</h3>
          <p className={styles.tagsDescription}>
            Use these search tags to find makeup tutorials tailored to your features
          </p>
          <div className={styles.tagsGrid}>
            {summary.youtube_tags.map((tag, index) => (
              <div key={index} className={styles.tag}>
                <span className={styles.tagIcon}>🔍</span>
                <span className={styles.tagText}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Confidence */}
      {data.overall_confidence !== undefined && (
        <div className={styles.overallConfidence}>
          <div className={styles.overallLabel}>
            Overall Analysis Confidence
          </div>
          <div className={styles.overallValue}>
            {(data.overall_confidence * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}
