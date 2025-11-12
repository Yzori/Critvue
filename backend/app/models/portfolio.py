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
    """Portfolio project model for user project showcase"""

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

    # Project information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Content type (matches ReviewRequest ContentType)
    # Values: "design", "code", "video", "audio", "writing", "art"
    content_type = Column(String(50), nullable=False, index=True)

    # Media
    image_url = Column(String(500), nullable=True)  # Cover image/thumbnail
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
    )

    # Relationships
    user = relationship("User", backref="portfolio_items")

    def __repr__(self) -> str:
        return f"<Portfolio {self.id}: {self.title[:30]}>"

    @property
    def is_featured_bool(self) -> bool:
        """Convert integer to boolean for is_featured"""
        return bool(self.is_featured)
