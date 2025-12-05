"""User Session database model for tracking active sessions"""

from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.user import Base


class UserSession(Base):
    """User session model for tracking active login sessions"""

    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Session identification
    session_token = Column(String(255), unique=True, nullable=False, index=True)

    # Device/browser info
    device_type = Column(String(50), nullable=True)  # desktop, mobile, tablet
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)

    # Location (derived from IP)
    location = Column(String(255), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)  # Current request session

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_active_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    # Relationship
    user = relationship("User", backref="sessions")

    def __repr__(self) -> str:
        return f"<UserSession id={self.id} user_id={self.user_id}>"
