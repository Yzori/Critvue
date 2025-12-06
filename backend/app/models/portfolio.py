"""Portfolio database model for showcasing user projects"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text
)
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User


class Portfolio(Base):
    """Portfolio project model for user project showcase

    Items can be:
    - Verified (linked to a review request) - unlimited
    - Self-documented (manually uploaded) - max 3 per user
    """

    __tablename__ = "portfolio"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to user
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Optional link to review request (if verified through reviews)
    # If null, this is a self-documented item
    review_request_id = Column(
        Integer,
        ForeignKey("review_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Project information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Content type (matches ReviewRequest ContentType)
    # Values: "design", "photography", "video", "stream", "audio", "writing", "art"
    content_type = Column(String(50), nullable=False, index=True)

    # Media - Before/After support
    image_url = Column(String(500), nullable=True)  # Main/After image
    before_image_url = Column(String(500), nullable=True)  # Before image for comparison
    project_url = Column(String(500), nullable=True)  # External link to project

    # Metrics
    rating = Column(
        Numeric(precision=3, scale=2),
        nullable=True
    )  # Average rating from reviews (1.00-5.00)

    views_count = Column(Integer, nullable=False, default=0, server_default='0')

    # Featured/highlight flag
    is_featured = Column(Integer, nullable=False, default=0, server_default='0')  # Using Integer for SQLite (0=False, 1=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Indexes for performance
    __table_args__ = (
        # Index for user's portfolio queries
        Index('idx_portfolio_user_created', 'user_id', 'created_at'),
        # Index for filtering by content type
        Index('idx_portfolio_content_type', 'content_type', 'created_at'),
        # Index for featured projects
        Index('idx_portfolio_featured', 'is_featured', 'created_at'),
        # Index for self-documented items (where review_request_id is NULL)
        Index('idx_portfolio_self_documented', 'user_id', 'review_request_id'),
    )

    # Relationships
    user = relationship("User", backref="portfolio_items")
    review_request = relationship("ReviewRequest", backref="portfolio_item")

    def __repr__(self) -> str:
        return f"<Portfolio {self.id}: {self.title[:30]}>"

    @property
    def is_featured_bool(self) -> bool:
        """Convert integer to boolean for is_featured"""
        return bool(self.is_featured)

    @property
    def is_self_documented(self) -> bool:
        """Check if this is a self-documented item (not linked to a review)"""
        return self.review_request_id is None

    @property
    def is_verified(self) -> bool:
        """Check if this is a verified item (linked to a review)"""
        return self.review_request_id is not None
