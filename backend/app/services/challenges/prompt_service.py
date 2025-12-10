"""
Challenge Prompt Service - Manages challenge prompts.
"""

from datetime import datetime
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review_request import ContentType
from app.models.challenge_prompt import ChallengePrompt, PromptDifficulty


class ChallengePromptService:
    """Service for managing challenge prompts."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_prompts(
        self,
        content_type: Optional[ContentType] = None,
        is_active: bool = True,
        limit: int = 50
    ) -> List[ChallengePrompt]:
        """Get available challenge prompts."""
        stmt = select(ChallengePrompt).where(ChallengePrompt.is_active == is_active)

        if content_type:
            stmt = stmt.where(ChallengePrompt.content_type == content_type)

        stmt = stmt.order_by(ChallengePrompt.times_used.desc()).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_prompt(self, prompt_id: int) -> Optional[ChallengePrompt]:
        """Get a specific prompt by ID."""
        return await self.db.get(ChallengePrompt, prompt_id)

    async def create_prompt(
        self,
        title: str,
        description: str,
        content_type: ContentType,
        difficulty: str = "intermediate",
        is_active: bool = True
    ) -> ChallengePrompt:
        """Create a new challenge prompt (admin only)."""
        prompt = ChallengePrompt(
            title=title,
            description=description,
            content_type=content_type,
            difficulty=PromptDifficulty(difficulty) if isinstance(difficulty, str) else difficulty,
            is_active=is_active,
            times_used=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self.db.add(prompt)
        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt

    async def update_prompt(self, prompt_id: int, **kwargs) -> Optional[ChallengePrompt]:
        """Update an existing challenge prompt (admin only)."""
        prompt = await self.get_prompt(prompt_id)
        if not prompt:
            return None

        for key, value in kwargs.items():
            if hasattr(prompt, key) and value is not None:
                setattr(prompt, key, value)

        prompt.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt

    async def delete_prompt(self, prompt_id: int) -> bool:
        """Soft-delete a challenge prompt by setting is_active=False."""
        prompt = await self.get_prompt(prompt_id)
        if not prompt:
            return False

        prompt.is_active = False
        prompt.updated_at = datetime.utcnow()
        await self.db.commit()

        return True

    async def increment_usage(self, prompt_id: int) -> None:
        """Increment the usage count of a prompt."""
        prompt = await self.get_prompt(prompt_id)
        if prompt:
            prompt.times_used += 1
            await self.db.commit()
