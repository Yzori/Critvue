"""
Challenge services module.

This module splits the challenge functionality into focused services:
- ChallengePromptService: Manages challenge prompts
- ChallengeInvitationService: Handles 1v1 invitations
- ChallengeEntryService: Manages entry submission and voting
- ChallengeLifecycleService: Handles challenge state transitions and completion
- ChallengeQueryService: Provides read-only query operations

Usage:
    from app.services.challenges import (
        ChallengePromptService,
        ChallengeInvitationService,
        ChallengeEntryService,
        ChallengeLifecycleService,
        ChallengeQueryService,
    )

    # Or use the facade for backward compatibility
    from app.services.challenges import ChallengeFacade
"""

from app.services.challenges.prompt_service import ChallengePromptService
from app.services.challenges.invitation_service import ChallengeInvitationService
from app.services.challenges.entry_service import ChallengeEntryService
from app.services.challenges.lifecycle_service import ChallengeLifecycleService
from app.services.challenges.query_service import ChallengeQueryService
from app.services.challenges.facade import ChallengeFacade, ChallengeService

__all__ = [
    "ChallengePromptService",
    "ChallengeInvitationService",
    "ChallengeEntryService",
    "ChallengeLifecycleService",
    "ChallengeQueryService",
    "ChallengeFacade",
    "ChallengeService",  # Alias for backward compatibility
]
