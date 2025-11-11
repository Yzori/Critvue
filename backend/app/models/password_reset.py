"""Password reset token database model"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.models.user import Base


class PasswordResetToken(Base):
    """
    Password reset token model

    Security considerations:
    - Tokens are hashed before storage to prevent token theft from database breaches
    - Tokens expire after 15 minutes
    - Tokens are single-use only (deleted after successful reset)
    - Used tokens remain in DB for audit trail but are marked as used
    """

    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Store hashed version of token for security
    # The actual token is sent to user's email, but we store only the hash
    token_hash = Column(String(255), unique=True, index=True, nullable=False)

    # Track token usage
    is_used = Column(String(1), default='0', nullable=False)  # '0' or '1' for SQLite compatibility
    used_at = Column(DateTime, nullable=True)

    # Expiration tracking
    expires_at = Column(DateTime, nullable=False)

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String(45), nullable=True)  # Support IPv6
    user_agent = Column(String(500), nullable=True)

    # Relationship to user
    user = relationship("User", backref="password_reset_tokens", lazy="joined")

    # Composite index for common queries
    __table_args__ = (
        Index('ix_password_reset_tokens_user_id_expires_at', 'user_id', 'expires_at'),
        Index('ix_password_reset_tokens_token_hash_is_used', 'token_hash', 'is_used'),
    )

    def mark_as_used(self) -> None:
        """Mark token as used"""
        self.is_used = '1'
        self.used_at = datetime.utcnow()

    def is_expired(self) -> bool:
        """Check if token is expired"""
        return datetime.utcnow() > self.expires_at

    def is_valid(self) -> bool:
        """Check if token is valid (not used and not expired)"""
        return self.is_used == '0' and not self.is_expired()

    def __repr__(self) -> str:
        return f"<PasswordResetToken user_id={self.user_id} expires_at={self.expires_at}>"
