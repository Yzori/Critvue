"""User and Profile database models"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, Numeric, String, Text
from sqlalchemy.orm import DeclarativeBase, relationship

if TYPE_CHECKING:
    from app.models.review_request import ReviewRequest


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


class UserRole(str, enum.Enum):
    """User role types"""
    CREATOR = "creator"
    REVIEWER = "reviewer"
    ADMIN = "admin"


class User(Base):
    """User model for authentication and basic info"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)

    # Role
    role = Column(Enum(UserRole), default=UserRole.CREATOR, nullable=False)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Profile
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    title = Column(String(255), nullable=True)
    specialty_tags = Column(Text, nullable=True)  # JSON stored as Text for SQLite
    badges = Column(Text, nullable=True)  # JSON stored as Text for SQLite

    # Stats
    total_reviews_given = Column(Integer, nullable=False, default=0, server_default='0')
    total_reviews_received = Column(Integer, nullable=False, default=0, server_default='0')
    avg_rating = Column(Numeric(precision=3, scale=2), nullable=True)
    avg_response_time_hours = Column(Integer, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    review_requests = relationship("ReviewRequest", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
