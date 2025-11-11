"""
Database models for facial analysis results

Uses SQLAlchemy ORM with PostgreSQL
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

Base = declarative_base()


class AnalysisResult(Base):
    """
    Model for storing facial analysis results
    """
    __tablename__ = 'analysis_results'

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Eye analysis
    eye_shape = Column(String(50), nullable=False)
    eye_secondary_features = Column(JSON)  # Array of secondary features
    eye_confidence = Column(Float)

    # Nose analysis
    nose_width = Column(String(50), nullable=False)
    nose_confidence = Column(Float)

    # Lip analysis
    lip_fullness = Column(String(50), nullable=False)
    lip_balance = Column(String(50))
    lip_confidence = Column(Float)

    # Overall metrics
    overall_confidence = Column(Float)

    # Full analysis data (stored as JSON for detailed retrieval)
    full_analysis = Column(JSON, nullable=False)

    # Summary data
    description = Column(String(500))
    search_tags = Column(JSON)  # Array of search tags

    def __repr__(self):
        return f"<AnalysisResult(id={self.id}, created_at={self.created_at})>"

    def to_dict(self):
        """Convert model to dictionary for API responses"""
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'features': {
                'eye_shape': self.eye_shape,
                'eye_secondary': self.eye_secondary_features,
                'nose_width': self.nose_width,
                'lip_fullness': self.lip_fullness,
                'lip_balance': self.lip_balance
            },
            'confidence': {
                'eye': self.eye_confidence,
                'nose': self.nose_confidence,
                'lip': self.lip_confidence,
                'overall': self.overall_confidence
            },
            'description': self.description,
            'search_tags': self.search_tags,
            'full_analysis': self.full_analysis
        }


# Database connection and session management
class Database:
    """
    Database connection manager
    """

    def __init__(self, database_url=None):
        """
        Initialize database connection

        Args:
            database_url: PostgreSQL connection URL
                         Format: postgresql://user:password@host:port/database
        """
        if database_url is None:
            database_url = os.getenv(
                'DATABASE_URL',
                'postgresql://postgres:postgres@localhost:5432/facial_analysis'
            )

        self.engine = create_engine(database_url, echo=False)
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )

    def create_tables(self):
        """Create all database tables"""
        Base.metadata.create_all(bind=self.engine)

    def get_session(self):
        """Get a new database session"""
        return self.SessionLocal()

    def drop_tables(self):
        """Drop all database tables (use with caution!)"""
        Base.metadata.drop_all(bind=self.engine)


# Global database instance
db = None


def get_database():
    """Get or create global database instance"""
    global db
    if db is None:
        db = Database()
    return db


def init_database():
    """Initialize database tables"""
    database = get_database()
    database.create_tables()
    print("✅ Database tables created successfully")
