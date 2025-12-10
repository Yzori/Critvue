"""
Common imports and utilities for desktop dashboard endpoints.

This module provides shared dependencies, imports, and utilities
used across all desktop dashboard endpoint modules.
"""

import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, Response
from fastapi.responses import JSONResponse
from sqlalchemy import select, and_, or_, func, case, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user, get_db
from app.constants import RateLimits, PaginationDefaults
from app.core.exceptions import InternalError, InvalidInputError
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus, PaymentStatus
from app.models.review_request import ReviewRequest, ReviewStatus
from app.utils import calculate_urgency, generate_etag, apply_sorting, apply_date_range_filter, get_display_name

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)


def create_router(tag_suffix: str = "") -> APIRouter:
    """Create a router with the dashboard-desktop prefix and tag."""
    tag = f"dashboard-desktop{'-' + tag_suffix if tag_suffix else ''}"
    return APIRouter(prefix="/dashboard", tags=[tag])


def build_pagination_response(
    total: int,
    page: int,
    page_size: int,
    items_count: int,
    skip: int
) -> Dict[str, Any]:
    """Build standard pagination response dict."""
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "has_more": (skip + items_count) < total
    }


def format_reviewer_info(reviewer: Any) -> Optional[Dict[str, Any]]:
    """Format reviewer information for response."""
    if not reviewer:
        return None
    return {
        "id": reviewer.id,
        "name": get_display_name(reviewer),
        "avatar_url": reviewer.avatar_url,
        "tier": reviewer.user_tier.value if reviewer.user_tier else "novice",
        "avg_rating": float(reviewer.avg_rating) if reviewer.avg_rating else None,
        "total_reviews": reviewer.reviews_given if hasattr(reviewer, 'reviews_given') else 0
    }


def format_review_request_info(
    review_request: Any,
    include_description: bool = False
) -> Optional[Dict[str, Any]]:
    """Format review request information for response."""
    if not review_request:
        return None

    info = {
        "id": review_request.id,
        "title": review_request.title,
        "content_type": review_request.content_type.value,
    }

    if include_description:
        info["description"] = review_request.description
        info["content_subcategory"] = getattr(review_request, 'content_subcategory', None)
        info["review_type"] = review_request.review_type.value if hasattr(review_request, 'review_type') else None
        info["external_links"] = getattr(review_request, 'external_links', None)

    return info


def calculate_draft_progress(slot: ReviewSlot) -> Dict[str, Any]:
    """Calculate draft progress for a review slot."""
    draft_progress = {
        "has_draft": bool(slot.draft_sections),
        "last_saved_at": slot.updated_at.isoformat() if slot.updated_at else None
    }

    if slot.draft_sections:
        try:
            draft_data = json.loads(slot.draft_sections) if isinstance(slot.draft_sections, str) else slot.draft_sections
            if isinstance(draft_data, dict):
                completed = sum([
                    1 if draft_data.get("phase1_quick_assessment") else 0,
                    1 if draft_data.get("phase2_rubric") else 0,
                    1 if draft_data.get("phase3_detailed_feedback") else 0
                ])
                draft_progress.update({
                    "sections_completed": completed,
                    "sections_total": 3,
                    "percentage": round(completed / 3 * 100, 1)
                })
        except (json.JSONDecodeError, TypeError, KeyError, AttributeError):
            # Draft data is malformed or invalid - continue with empty progress
            pass

    return draft_progress
