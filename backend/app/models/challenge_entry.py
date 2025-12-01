"""Challenge Entry model for participant submissions in challenges"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.challenge import Challenge
    from app.models.challenge_vote import ChallengeVote


class ChallengeEntry(Base):
    """
    Challenge Entry model for participant submissions.

    Each participant in a challenge submits one entry.
    For 1v1: Entries are blind until both participants have submitted.
    For Category: All entries are visible after submission.
    """

    __tablename__ = "challenge_entries"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    challenge_id = Column(
        Integer,
        ForeignKey("challenges.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Entry content
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # File attachments (JSON array of file metadata)
    # Structure: [{"url": "...", "filename": "...", "size": 1234, "type": "image/png"}]
    file_urls = Column(JSON, nullable=True)

    # External links (for video, streaming, etc.)
    # Structure: [{"url": "...", "type": "youtube|vimeo|etc", "title": "..."}]
    external_links = Column(JSON, nullable=True)

    # Thumbnail for preview
    thumbnail_url = Column(String(500), nullable=True)

    # Vote tracking
    vote_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)  # NULL until officially submitted

    # Ensure one entry per user per challenge
    __table_args__ = (
        UniqueConstraint('challenge_id', 'user_id', name='unique_challenge_entry'),
    )

    # Relationships
    challenge = relationship("Challenge", back_populates="entries")
    user = relationship("User", backref="challenge_entries")
    votes = relationship("ChallengeVote", back_populates="entry", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ChallengeEntry {self.id}: Challenge {self.challenge_id} by User {self.user_id}>"

    @property
    def is_submitted(self) -> bool:
        """Check if entry has been officially submitted"""
        return self.submitted_at is not None

    @property
    def has_content(self) -> bool:
        """Check if entry has any content (files or links)"""
        has_files = self.file_urls and len(self.file_urls) > 0
        has_links = self.external_links and len(self.external_links) > 0
        return has_files or has_links

    def submit(self) -> None:
        """Mark entry as submitted"""
        if self.submitted_at is None:
            self.submitted_at = datetime.utcnow()
