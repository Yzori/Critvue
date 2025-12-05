"""Privacy Settings database model"""

import enum
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.models.user import Base


class ProfileVisibility(str, enum.Enum):
    """Profile visibility options"""
    PUBLIC = "public"
    CONNECTIONS = "connections"
    PRIVATE = "private"


class PrivacySettings(Base):
    """User privacy settings model"""

    __tablename__ = "privacy_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Profile visibility
    profile_visibility = Column(
        Enum(ProfileVisibility, values_callable=lambda x: [e.value for e in x]),
        default=ProfileVisibility.PUBLIC,
        nullable=False
    )

    # Leaderboard & karma
    show_on_leaderboard = Column(Boolean, default=True, nullable=False)
    show_karma_publicly = Column(Boolean, default=True, nullable=False)

    # Activity & discovery
    show_activity_status = Column(Boolean, default=True, nullable=False)
    allow_review_discovery = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    user = relationship("User", backref="privacy_settings")

    def __repr__(self) -> str:
        return f"<PrivacySettings user_id={self.user_id}>"
