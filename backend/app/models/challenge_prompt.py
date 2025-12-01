"""Challenge Prompt model for platform-curated challenges"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.user import Base
from app.models.review_request import ContentType

if TYPE_CHECKING:
    from app.models.challenge import Challenge


class PromptDifficulty(str, enum.Enum):
    """Difficulty levels for challenge prompts"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ChallengePrompt(Base):
    """
    Challenge Prompt model for platform-curated challenges.

    Pre-defined prompts that admins select when creating challenges.
    Prompts are categorized by content type and difficulty.
    """

    __tablename__ = "challenge_prompts"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Prompt content
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    # Categorization
    content_type = Column(
        Enum(ContentType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    difficulty = Column(
        Enum(PromptDifficulty, values_callable=lambda x: [e.value for e in x]),
        default=PromptDifficulty.INTERMEDIATE,
        nullable=False,
        index=True
    )

    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Usage tracking
    times_used = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    challenges = relationship("Challenge", back_populates="prompt")

    def __repr__(self) -> str:
        return f"<ChallengePrompt {self.id}: {self.title[:30]} [{self.content_type}]>"

    def increment_usage(self) -> None:
        """Increment the usage counter"""
        self.times_used += 1
