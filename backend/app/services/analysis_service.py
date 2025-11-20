"""
Analysis service for saving and retrieving facial analysis results
"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models import FeatureAnalysis, get_database


class AnalysisService:
    """
    Service for managing facial analysis results in the database
    """

    @staticmethod
    def save_analysis(analysis_data: Dict) -> FeatureAnalysis:
        """
        Save facial analysis results to database

        Args:
            analysis_data: Complete analysis data from face analyzer

        Returns:
            FeatureAnalysis model instance
        """
        db = get_database()
        session = db.get_session()

        try:
            # Extract data from analysis - map to simple schema
            eye_analysis = analysis_data.get("eye_analysis", {})
            nose_analysis = analysis_data.get("nose_analysis", {})
            lip_analysis = analysis_data.get("lip_analysis", {})

            # Create database record with simple schema
            result = FeatureAnalysis(
                eye_shape=eye_analysis.get("eye_shape", "unknown").lower(),
                nose=nose_analysis.get("nose_width", "unknown").lower(),
                lips=lip_analysis.get("lip_fullness", "unknown").lower(),
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
    def get_analysis_by_id(analysis_id: str) -> Optional[FeatureAnalysis]:
        """
        Retrieve analysis result by ID

        Args:
            analysis_id: UUID of the analysis

        Returns:
            FeatureAnalysis instance or None
        """
        db = get_database()
        session = db.get_session()

        try:
            result = (
                session.query(FeatureAnalysis)
                .filter(FeatureAnalysis.id == analysis_id)
                .first()
            )
            return result
        finally:
            session.close()

    @staticmethod
    def get_recent_analyses(limit: int = 10) -> List[FeatureAnalysis]:
        """
        Get most recent analysis results

        Args:
            limit: Maximum number of results to return

        Returns:
            List of FeatureAnalysis instances
        """
        db = get_database()
        session = db.get_session()

        try:
            results = (
                session.query(FeatureAnalysis)
                .order_by(FeatureAnalysis.created_at.desc())
                .limit(limit)
                .all()
            )
            return results
        finally:
            session.close()

    @staticmethod
    def get_analyses_by_features(
        eye_shape: Optional[str] = None,
        nose: Optional[str] = None,
        lips: Optional[str] = None,
        limit: int = 10,
    ) -> List[FeatureAnalysis]:
        """
        Search analyses by facial features

        Args:
            eye_shape: Filter by eye shape
            nose: Filter by nose width
            lips: Filter by lip fullness
            limit: Maximum results to return

        Returns:
            List of matching FeatureAnalysis instances
        """
        db = get_database()
        session = db.get_session()

        try:
            query = session.query(FeatureAnalysis)

            if eye_shape:
                query = query.filter(FeatureAnalysis.eye_shape == eye_shape.lower())
            if nose:
                query = query.filter(FeatureAnalysis.nose == nose.lower())
            if lips:
                query = query.filter(FeatureAnalysis.lips == lips.lower())

            results = (
                query.order_by(FeatureAnalysis.created_at.desc()).limit(limit).all()
            )

            return results
        finally:
            session.close()

    @staticmethod
    def delete_analysis(analysis_id: str) -> bool:
        """
        Delete an analysis result

        Args:
            analysis_id: UUID of the analysis to delete

        Returns:
            True if deleted, False if not found
        """
        db = get_database()
        session = db.get_session()

        try:
            result = (
                session.query(FeatureAnalysis)
                .filter(FeatureAnalysis.id == analysis_id)
                .first()
            )

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
