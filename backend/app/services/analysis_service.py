"""
Analysis service for saving and retrieving facial analysis results
"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models import AnalysisResult, get_database


class AnalysisService:
    """
    Service for managing facial analysis results in the database
    """

    @staticmethod
    def save_analysis(analysis_data: Dict) -> AnalysisResult:
        """
        Save facial analysis results to database

        Args:
            analysis_data: Complete analysis data from face analyzer

        Returns:
            AnalysisResult model instance
        """
        db = get_database()
        session = db.get_session()

        try:
            # Extract data from analysis
            eye_analysis = analysis_data.get('eye_analysis', {})
            nose_analysis = analysis_data.get('nose_analysis', {})
            lip_analysis = analysis_data.get('lip_analysis', {})
            summary = analysis_data.get('summary', {})

            # Create database record
            result = AnalysisResult(
                # Eye features
                eye_shape=eye_analysis.get('eye_shape', 'Unknown'),
                eye_secondary_features=eye_analysis.get('secondary_features', []),
                eye_confidence=max(
                    eye_analysis.get('confidence_scores', {}).values(),
                    default=0.0
                ),

                # Nose features
                nose_width=nose_analysis.get('nose_width', 'Unknown'),
                nose_confidence=nose_analysis.get('confidence', 0.0),

                # Lip features
                lip_fullness=lip_analysis.get('lip_fullness', 'Unknown'),
                lip_balance=lip_analysis.get('lip_balance', 'Unknown'),
                lip_confidence=lip_analysis.get('confidence', 0.0),

                # Overall
                overall_confidence=summary.get('overall_confidence', 0.0),

                # Summary
                description=summary.get('description', ''),
                search_tags=summary.get('search_tags', []),

                # Full data
                full_analysis=analysis_data
            )

            session.add(result)
            session.commit()
            session.refresh(result)

            return result

        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    @staticmethod
    def get_analysis_by_id(analysis_id: int) -> Optional[AnalysisResult]:
        """
        Retrieve analysis result by ID

        Args:
            analysis_id: Database ID of the analysis

        Returns:
            AnalysisResult instance or None
        """
        db = get_database()
        session = db.get_session()

        try:
            result = session.query(AnalysisResult).filter(
                AnalysisResult.id == analysis_id
            ).first()
            return result
        finally:
            session.close()

    @staticmethod
    def get_recent_analyses(limit: int = 10) -> List[AnalysisResult]:
        """
        Get most recent analysis results

        Args:
            limit: Maximum number of results to return

        Returns:
            List of AnalysisResult instances
        """
        db = get_database()
        session = db.get_session()

        try:
            results = session.query(AnalysisResult).order_by(
                AnalysisResult.created_at.desc()
            ).limit(limit).all()
            return results
        finally:
            session.close()

    @staticmethod
    def get_analyses_by_features(
        eye_shape: Optional[str] = None,
        nose_width: Optional[str] = None,
        lip_fullness: Optional[str] = None,
        limit: int = 10
    ) -> List[AnalysisResult]:
        """
        Search analyses by facial features

        Args:
            eye_shape: Filter by eye shape
            nose_width: Filter by nose width
            lip_fullness: Filter by lip fullness
            limit: Maximum results to return

        Returns:
            List of matching AnalysisResult instances
        """
        db = get_database()
        session = db.get_session()

        try:
            query = session.query(AnalysisResult)

            if eye_shape:
                query = query.filter(AnalysisResult.eye_shape == eye_shape)
            if nose_width:
                query = query.filter(AnalysisResult.nose_width == nose_width)
            if lip_fullness:
                query = query.filter(AnalysisResult.lip_fullness == lip_fullness)

            results = query.order_by(
                AnalysisResult.created_at.desc()
            ).limit(limit).all()

            return results
        finally:
            session.close()

    @staticmethod
    def delete_analysis(analysis_id: int) -> bool:
        """
        Delete an analysis result

        Args:
            analysis_id: ID of the analysis to delete

        Returns:
            True if deleted, False if not found
        """
        db = get_database()
        session = db.get_session()

        try:
            result = session.query(AnalysisResult).filter(
                AnalysisResult.id == analysis_id
            ).first()

            if result:
                session.delete(result)
                session.commit()
                return True
            return False
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
