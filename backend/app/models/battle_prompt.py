"""Battle Prompt model for platform-curated challenges"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.user import Base
from app.models.review_request import ContentType

if TYPE_CHECKING:
    from app.models.battle import Battle


class PromptDifficulty(str, enum.Enum):
    """Difficulty levels for battle prompts"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class BattlePrompt(Base):
    """
    Battle Prompt model for platform-curated challenges.

    Pre-defined prompts that users select when creating/joining battles.
    Prompts are categorized by content type and difficulty.
    """

    __tablename__ = "battle_prompts"

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
    battles = relationship("Battle", back_populates="prompt")

    def __repr__(self) -> str:
        return f"<BattlePrompt {self.id}: {self.title[:30]} [{self.content_type}]>"

    def increment_usage(self) -> None:
        """Increment the usage counter"""
        self.times_used += 1
