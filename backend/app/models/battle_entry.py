"""Battle Entry model for participant submissions in battles"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.battle import Battle
    from app.models.battle_vote import BattleVote


class BattleEntry(Base):
    """
    Battle Entry model for participant submissions.

    Each participant in a battle submits one entry.
    Entries are blind until both participants have submitted.
    """

    __tablename__ = "battle_entries"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    battle_id = Column(
        Integer,
        ForeignKey("battles.id", ondelete="CASCADE"),
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

    # Relationships
    battle = relationship("Battle", back_populates="entries")
    user = relationship("User", backref="battle_entries")
    votes = relationship("BattleVote", back_populates="entry", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<BattleEntry {self.id}: Battle {self.battle_id} by User {self.user_id}>"

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
