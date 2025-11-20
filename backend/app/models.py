"""
Database models for facial analysis results

Uses SQLAlchemy ORM with PostgreSQL/Supabase
"""

from sqlalchemy import Column, String, DateTime, create_engine
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
import os

Base = declarative_base()


class FeatureAnalysis(Base):
    """
    Model for storing facial feature analysis
    Schema matches the Feature Analysis table from database design
    """
    __tablename__ = 'feature_analysis'

    # Primary key - UUID for Supabase compatibility
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Feature classifications
    eye_shape = Column(String(50), nullable=False)  # e.g., "almond", "round"
    nose = Column(String(50), nullable=False)       # e.g., "medium", "wide"
    lips = Column(String(50), nullable=False)       # e.g., "full", "thin"

    # Timestamp
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<FeatureAnalysis(id={self.id}, eye_shape={self.eye_shape}, nose={self.nose}, lips={self.lips})>"

    def to_dict(self):
        """Convert model to dictionary for API responses"""
        return {
            'id': str(self.id),
            'eye_shape': self.eye_shape,
            'nose': self.nose,
            'lips': self.lips,
            'created_at': self.created_at.isoformat() if self.created_at else None
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
            database_url: PostgreSQL/Supabase connection URL
                         Format: postgresql://user:password@host:port/database
        """
        if database_url is None:
            database_url = os.getenv('DATABASE_URL')
            if not database_url:
                raise ValueError(
                    "DATABASE_URL environment variable is not set. "
                    "Please set it in your .env file with your Supabase connection string."
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
