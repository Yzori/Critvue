"""CRUD operations for review slots"""

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.review_slot import (
    ReviewSlot,
    ReviewSlotStatus,
    RejectionReason,
    DisputeResolution
)
from app.models.review_request import ReviewRequest, ReviewType
from app.schemas.review_slot import ReviewSlotCreate

logger = logging.getLogger(__name__)


# ===== Create Operations =====

async def create_review_slots(
    db: AsyncSession,
    review_request_id: int,
    num_slots: int,
    payment_amount: Optional[Decimal] = None
) -> List[ReviewSlot]:
    """
    Create multiple review slots for a review request

    Args:
        db: Database session
        review_request_id: ID of the review request
        num_slots: Number of slots to create
        payment_amount: Optional payment amount for expert reviews

    Returns:
        List of created review slots

    Raises:
        ValueError: If num_slots is invalid
    """
    if num_slots < 1 or num_slots > 10:
        raise ValueError("Number of slots must be between 1 and 10")

    slots = []
    for _ in range(num_slots):
        slot = ReviewSlot(
            review_request_id=review_request_id,
            payment_amount=payment_amount,
            status=ReviewSlotStatus.AVAILABLE.value
        )
        db.add(slot)
        slots.append(slot)

    await db.commit()

    # Refresh to get IDs
    for slot in slots:
        await db.refresh(slot)

    logger.info(
        f"Created {num_slots} review slots for review_request_id={review_request_id}"
    )
    return slots


# ===== Read Operations =====

async def get_review_slot(
    db: AsyncSession,
    slot_id: int,
    user_id: Optional[int] = None
) -> Optional[ReviewSlot]:
    """
    Get a single review slot by ID

    Args:
        db: Database session
        slot_id: Slot ID
        user_id: Optional user ID for access control

    Returns:
        ReviewSlot or None if not found
    """
    query = (
        select(ReviewSlot)
        .where(ReviewSlot.id == slot_id)
        .options(selectinload(ReviewSlot.review_request))  # Eager load for authorization checks
    )

    # Optionally filter by user access
    if user_id is not None:
        query = query.join(ReviewRequest).where(
            or_(
                ReviewSlot.reviewer_id == user_id,
                ReviewRequest.user_id == user_id
            )
        )

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_review_slot_with_lock(
    db: AsyncSession,
    slot_id: int
) -> Optional[ReviewSlot]:
    """
    Get a review slot with row-level lock (for claim operations)

    Args:
        db: Database session
        slot_id: Slot ID

    Returns:
        ReviewSlot or None if not found
    """
    query = (
        select(ReviewSlot)
        .where(ReviewSlot.id == slot_id)
        .with_for_update()  # Row-level lock
    )

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_slots_for_request(
    db: AsyncSession,
    review_request_id: int,
    status: Optional[ReviewSlotStatus] = None
) -> List[ReviewSlot]:
    """
    Get all review slots for a review request

    Args:
        db: Database session
        review_request_id: Review request ID
        status: Optional status filter

    Returns:
        List of review slots
    """
    query = select(ReviewSlot).where(
        ReviewSlot.review_request_id == review_request_id
    )

    if status:
        query = query.where(ReviewSlot.status == status.value)

    query = query.order_by(ReviewSlot.created_at.desc())

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_user_review_slots(
    db: AsyncSession,
    user_id: int,
    status: Optional[List[ReviewSlotStatus]] = None,
    skip: int = 0,
    limit: int = 20
) -> Tuple[List[ReviewSlot], int]:
    """
    Get all review slots for a reviewer (paginated)

    Args:
        db: Database session
        user_id: Reviewer user ID
        status: Optional status filter - can be a single status or list of statuses
        skip: Pagination offset
        limit: Pagination limit

    Returns:
        Tuple of (slots, total_count)
    """
    # Base query
    query = (
        select(ReviewSlot)
        .where(ReviewSlot.reviewer_id == user_id)
        .options(selectinload(ReviewSlot.review_request))
    )

    if status:
        # Support both single status and list of statuses
        if isinstance(status, list):
            # Multiple statuses - use IN clause
            status_values = [s.value for s in status]
            query = query.where(ReviewSlot.status.in_(status_values))
        else:
            # Single status (backward compatibility)
            query = query.where(ReviewSlot.status == status.value)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated results
    query = query.order_by(ReviewSlot.updated_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    slots = list(result.scalars().all())

    return slots, total


async def get_available_slots(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    content_type: Optional[str] = None
) -> Tuple[List[ReviewSlot], int]:
    """
    Get all available review slots (for browse marketplace)

    Args:
        db: Database session
        skip: Pagination offset
        limit: Pagination limit
        content_type: Optional content type filter

    Returns:
        Tuple of (slots, total_count)
    """
    # Base query - only available slots
    query = (
        select(ReviewSlot)
        .join(ReviewRequest)
        .where(
            and_(
                ReviewSlot.status == ReviewSlotStatus.AVAILABLE.value,
                ReviewRequest.status == "pending"  # Only active review requests
            )
        )
        .options(selectinload(ReviewSlot.review_request))
    )

    if content_type:
        query = query.where(ReviewRequest.content_type == content_type)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated results
    query = query.order_by(ReviewSlot.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    slots = list(result.scalars().all())

    return slots, total


# ===== Claim Operations =====

async def claim_review_slot(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int,
    claim_hours: int = 72
) -> ReviewSlot:
    """
    DEPRECATED: Use app.services.claim_service.claim_review_by_slot_id() instead.

    This function is maintained for backward compatibility but the claim_service
    provides a consolidated, more robust implementation with better error handling
    and validation.

    Use claim_service.claim_review_by_slot_id() which:
    - Provides unified claiming logic across browse and review-slots APIs
    - Better validation and error messages
    - Consistent transaction management
    - Returns properly refreshed slots

    Args:
        db: Database session
        slot_id: Slot ID
        reviewer_id: Reviewer user ID
        claim_hours: Hours until deadline (default 72)

    Returns:
        Updated review slot

    Raises:
        ValueError: If slot cannot be claimed
        RuntimeError: If slot not found or already claimed
    """
    # Get slot with row lock to prevent race conditions
    slot = await get_review_slot_with_lock(db, slot_id)

    if not slot:
        raise RuntimeError(f"Review slot {slot_id} not found")

    # Check if slot is available
    if not slot.is_claimable:
        raise ValueError(f"Slot is not available (current status: {slot.status})")

    # Check if reviewer already has a slot for this request (prevent multiple claims)
    existing_claim = await db.execute(
        select(ReviewSlot).where(
            and_(
                ReviewSlot.review_request_id == slot.review_request_id,
                ReviewSlot.reviewer_id == reviewer_id,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.CLAIMED.value,
                    ReviewSlotStatus.SUBMITTED.value
                ])
            )
        )
    )

    if existing_claim.scalar_one_or_none():
        raise ValueError(
            "You have already claimed a slot for this review request. "
            "Complete or abandon your current claim before claiming another."
        )

    # Claim the slot using model method
    slot.claim(reviewer_id, claim_hours)

    # Update review request's reviews_claimed count
    request = await db.get(ReviewRequest, slot.review_request_id)
    if request:
        request.reviews_claimed += 1

    await db.commit()
    await db.refresh(slot)

    logger.info(
        f"User {reviewer_id} claimed slot {slot_id} "
        f"(deadline: {slot.claim_deadline})"
    )

    return slot


async def abandon_review_slot(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int
) -> ReviewSlot:
    """
    DEPRECATED: Use app.services.claim_service.unclaim_review_slot() instead.

    This function is maintained for backward compatibility but the claim_service
    provides a consolidated implementation.

    Use claim_service.unclaim_review_slot() which:
    - Provides unified unclaim/abandon logic across APIs
    - Better error handling with ClaimValidationError
    - Consistent transaction management

    Args:
        db: Database session
        slot_id: Slot ID
        reviewer_id: Reviewer user ID

    Returns:
        Updated review slot

    Raises:
        ValueError: If slot cannot be abandoned
        PermissionError: If user is not the reviewer
    """
    slot = await get_review_slot(db, slot_id)

    if not slot:
        raise RuntimeError(f"Review slot {slot_id} not found")

    if slot.reviewer_id != reviewer_id:
        raise PermissionError("You cannot abandon a slot you don't own")

    # Abandon the slot using model method
    slot.abandon()

    # Update review request's reviews_claimed count
    request = await db.get(ReviewRequest, slot.review_request_id)
    if request:
        request.reviews_claimed = max(0, request.reviews_claimed - 1)

    await db.commit()
    await db.refresh(slot)

    logger.info(f"User {reviewer_id} abandoned slot {slot_id}")

    return slot


# ===== Submit & Review Operations =====

async def submit_review(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int,
    review_text: Optional[str],
    rating: int,
    attachments: Optional[list] = None,
    feedback_sections: Optional[list] = None,
    annotations: Optional[list] = None
) -> ReviewSlot:
    """
    Submit a review for a claimed slot (supports both structured and legacy formats)

    Args:
        db: Database session
        slot_id: Slot ID
        reviewer_id: Reviewer user ID
        review_text: Review content (legacy format, optional if feedback_sections provided)
        rating: Rating 1-5
        attachments: Optional list of attachments
        feedback_sections: Optional structured feedback sections
        annotations: Optional context-specific annotations

    Returns:
        Updated review slot

    Raises:
        ValueError: If slot cannot accept submission or content invalid
        PermissionError: If user is not the reviewer
    """
    slot = await get_review_slot(db, slot_id)

    if not slot:
        raise RuntimeError(f"Review slot {slot_id} not found")

    if slot.reviewer_id != reviewer_id:
        raise PermissionError("You cannot submit a review for a slot you don't own")

    # Handle structured vs legacy submission
    if feedback_sections:
        import json
        import html
        from bleach import clean

        # Allowed HTML tags (basic formatting only)
        ALLOWED_TAGS = ['b', 'i', 'u', 'br', 'p', 'ul', 'ol', 'li', 'strong', 'em']

        try:
            # Sanitize feedback sections to prevent XSS
            sanitized_sections = []
            for section in feedback_sections:
                sanitized_section = section.copy()
                sanitized_section['content'] = clean(
                    sanitized_section['content'],
                    tags=ALLOWED_TAGS,
                    strip=True
                )
                sanitized_sections.append(sanitized_section)

            # Store sanitized structured sections
            slot.feedback_sections = json.dumps(sanitized_sections)

            # Store annotations if provided (sanitize content fields)
            if annotations:
                sanitized_annotations = []
                for annotation in annotations:
                    sanitized_annotation = annotation.copy()
                    if 'content' in sanitized_annotation:
                        sanitized_annotation['content'] = clean(
                            sanitized_annotation['content'],
                            tags=ALLOWED_TAGS,
                            strip=True
                        )
                    sanitized_annotations.append(sanitized_annotation)
                slot.annotations = json.dumps(sanitized_annotations)

            # Generate review_text from sanitized sections for backward compatibility
            if not review_text:
                review_text = "\n\n".join([
                    f"**{html.escape(section['section_label'])}**\n{html.escape(section['content'])}"
                    for section in sanitized_sections
                ])
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.error(f"Failed to process structured feedback for slot {slot_id}: {e}")
            raise ValueError(f"Invalid structured feedback format: {e}")

    # Submit review using model method (still uses review_text internally)
    slot.submit_review(review_text or "", rating, attachments)

    await db.commit()
    await db.refresh(slot)

    logger.info(
        f"User {reviewer_id} submitted review for slot {slot_id} "
        f"(structured: {bool(feedback_sections)})"
    )

    return slot


async def accept_review(
    db: AsyncSession,
    slot_id: int,
    requester_id: int,
    helpful_rating: Optional[int] = None,
    is_auto: bool = False
) -> ReviewSlot:
    """
    Accept a submitted review

    Args:
        db: Database session
        slot_id: Slot ID
        requester_id: Review requester user ID
        helpful_rating: Optional 1-5 rating of helpfulness
        is_auto: Whether this is auto-acceptance

    Returns:
        Updated review slot

    Raises:
        ValueError: If slot cannot be accepted
        PermissionError: If user is not the requester
    """
    slot = await get_review_slot(db, slot_id)

    if not slot:
        raise RuntimeError(f"Review slot {slot_id} not found")

    # Get review request to verify ownership
    request = await db.get(ReviewRequest, slot.review_request_id)
    if not request:
        raise RuntimeError(f"Review request not found")

    if not is_auto and request.user_id != requester_id:
        raise PermissionError("You cannot accept reviews for requests you don't own")

    # Accept review using model method
    slot.accept(is_auto=is_auto, helpful_rating=helpful_rating)

    # Update review request's reviews_completed count
    request.reviews_completed += 1

    # Check if all requested reviews are completed
    if request.reviews_completed >= request.reviews_requested:
        request.status = "completed"
        request.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(slot)

    logger.info(
        f"Review for slot {slot_id} accepted by "
        f"{'auto-accept' if is_auto else f'user {requester_id}'}"
    )

    return slot


async def reject_review(
    db: AsyncSession,
    slot_id: int,
    requester_id: int,
    reason: RejectionReason,
    notes: Optional[str] = None
) -> ReviewSlot:
    """
    Reject a submitted review

    Args:
        db: Database session
        slot_id: Slot ID
        requester_id: Review requester user ID
        reason: Rejection reason
        notes: Optional detailed explanation

    Returns:
        Updated review slot

    Raises:
        ValueError: If slot cannot be rejected or invalid reason
        PermissionError: If user is not the requester
    """
    slot = await get_review_slot(db, slot_id)

    if not slot:
        raise RuntimeError(f"Review slot {slot_id} not found")

    # Get review request to verify ownership
    request = await db.get(ReviewRequest, slot.review_request_id)
    if not request:
        raise RuntimeError(f"Review request not found")

    if request.user_id != requester_id:
        raise PermissionError("You cannot reject reviews for requests you don't own")

    # Reject review using model method
    slot.reject(reason, notes)

    # Decrement reviews_claimed to allow another review to be submitted
    request.reviews_claimed = max(0, request.reviews_claimed - 1)

    await db.commit()
    await db.refresh(slot)

    logger.info(
        f"Review for slot {slot_id} rejected by user {requester_id} "
        f"(reason: {reason.value})"
    )

    return slot


# ===== Dispute Operations =====

async def create_dispute(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int,
    dispute_reason: str
) -> ReviewSlot:
    """
    Create a dispute for a rejected review

    Args:
        db: Database session
        slot_id: Slot ID
        reviewer_id: Reviewer user ID
        dispute_reason: Explanation for dispute

    Returns:
        Updated review slot

    Raises:
        ValueError: If slot cannot be disputed
        PermissionError: If user is not the reviewer
    """
    slot = await get_review_slot(db, slot_id)

    if not slot:
        raise RuntimeError(f"Review slot {slot_id} not found")

    if slot.reviewer_id != reviewer_id:
        raise PermissionError("You cannot dispute a review you didn't write")

    # Create dispute using model method
    slot.dispute(dispute_reason)

    await db.commit()
    await db.refresh(slot)

    logger.info(f"User {reviewer_id} created dispute for slot {slot_id}")

    return slot


async def resolve_dispute(
    db: AsyncSession,
    slot_id: int,
    admin_id: int,
    resolution: DisputeResolution,
    admin_notes: Optional[str] = None
) -> ReviewSlot:
    """
    Admin resolves a dispute

    Args:
        db: Database session
        slot_id: Slot ID
        admin_id: Admin user ID
        resolution: Admin decision
        admin_notes: Optional admin explanation

    Returns:
        Updated review slot

    Raises:
        ValueError: If slot is not disputed
    """
    slot = await get_review_slot(db, slot_id)

    if not slot:
        raise RuntimeError(f"Review slot {slot_id} not found")

    # Resolve dispute using model method
    slot.resolve_dispute(resolution, admin_notes)

    # If accepted, update review request counts
    if resolution == DisputeResolution.ADMIN_ACCEPTED:
        request = await db.get(ReviewRequest, slot.review_request_id)
        if request:
            request.reviews_completed += 1
            request.reviews_claimed += 1  # Re-increment since it was decremented

            # Check if all requested reviews are completed
            if request.reviews_completed >= request.reviews_requested:
                request.status = "completed"
                request.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(slot)

    logger.info(
        f"Admin {admin_id} resolved dispute for slot {slot_id} "
        f"(resolution: {resolution.value})"
    )

    return slot


async def get_disputed_slots(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20
) -> Tuple[List[ReviewSlot], int]:
    """
    Get all disputed review slots (for admin dashboard)

    Args:
        db: Database session
        skip: Pagination offset
        limit: Pagination limit

    Returns:
        Tuple of (slots, total_count)
    """
    query = (
        select(ReviewSlot)
        .where(ReviewSlot.status == ReviewSlotStatus.DISPUTED.value)
        .options(
            selectinload(ReviewSlot.review_request),
            selectinload(ReviewSlot.reviewer)
        )
    )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated results
    query = query.order_by(ReviewSlot.updated_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    slots = list(result.scalars().all())

    return slots, total


# ===== Elaboration Operations =====

async def request_elaboration(
    db: AsyncSession,
    slot_id: int,
    requester_id: int,
    elaboration_request: str,
    response_hours: int = 48
) -> ReviewSlot:
    """
    Request elaboration on a submitted review

    Args:
        db: Database session
        slot_id: Slot ID
        requester_id: Review requester user ID
        elaboration_request: What the creator wants elaborated
        response_hours: Hours for reviewer to respond (default 48)

    Returns:
        Updated review slot

    Raises:
        ValueError: If slot cannot have elaboration requested
        PermissionError: If user is not the requester
    """
    slot = await get_review_slot(db, slot_id)

    if not slot:
        raise RuntimeError(f"Review slot {slot_id} not found")

    # Get review request to verify ownership
    request = await db.get(ReviewRequest, slot.review_request_id)
    if not request:
        raise RuntimeError(f"Review request not found")

    if request.user_id != requester_id:
        raise PermissionError("You cannot request elaboration for reviews you don't own")

    # Request elaboration using model method
    slot.request_elaboration(elaboration_request, response_hours)

    await db.commit()
    await db.refresh(slot)

    logger.info(
        f"User {requester_id} requested elaboration for slot {slot_id} "
        f"(count: {slot.elaboration_count})"
    )

    return slot


async def respond_to_elaboration(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int
) -> ReviewSlot:
    """
    Respond to an elaboration request (resubmits review to SUBMITTED status)

    Note: The actual content update happens through the submit_smart_review endpoint.
    This function just transitions the status back to SUBMITTED.

    Args:
        db: Database session
        slot_id: Slot ID
        reviewer_id: Reviewer user ID

    Returns:
        Updated review slot

    Raises:
        ValueError: If slot is not in elaboration requested state
        PermissionError: If user is not the reviewer
    """
    slot = await get_review_slot(db, slot_id)

    if not slot:
        raise RuntimeError(f"Review slot {slot_id} not found")

    if slot.reviewer_id != reviewer_id:
        raise PermissionError("You cannot respond to an elaboration request for a slot you don't own")

    # Respond to elaboration using model method
    slot.respond_to_elaboration()

    await db.commit()
    await db.refresh(slot)

    logger.info(
        f"User {reviewer_id} responded to elaboration request for slot {slot_id}"
    )

    return slot


async def get_elaboration_requested_slots(
    db: AsyncSession,
    reviewer_id: int
) -> List[ReviewSlot]:
    """
    Get all slots with pending elaboration requests for a reviewer

    Args:
        db: Database session
        reviewer_id: Reviewer user ID

    Returns:
        List of review slots awaiting elaboration
    """
    query = (
        select(ReviewSlot)
        .where(
            and_(
                ReviewSlot.reviewer_id == reviewer_id,
                ReviewSlot.status == ReviewSlotStatus.ELABORATION_REQUESTED.value
            )
        )
        .options(selectinload(ReviewSlot.review_request))
        .order_by(ReviewSlot.elaboration_deadline.asc())
    )

    result = await db.execute(query)
    return list(result.scalars().all())


# ===== Background Job Operations =====

async def process_expired_claims(db: AsyncSession) -> int:
    """
    Process slots with expired claim deadlines (background job)

    Args:
        db: Database session

    Returns:
        Number of slots marked as abandoned
    """
    now = datetime.utcnow()

    # Find expired claimed slots
    query = select(ReviewSlot).where(
        and_(
            ReviewSlot.status == ReviewSlotStatus.CLAIMED.value,
            ReviewSlot.claim_deadline < now
        )
    )

    result = await db.execute(query)
    expired_slots = list(result.scalars().all())

    count = 0
    for slot in expired_slots:
        try:
            slot.abandon()

            # Update review request's reviews_claimed count
            request = await db.get(ReviewRequest, slot.review_request_id)
            if request:
                request.reviews_claimed = max(0, request.reviews_claimed - 1)

            count += 1
        except Exception as e:
            logger.error(f"Error abandoning expired slot {slot.id}: {e}")

    if count > 0:
        await db.commit()
        logger.info(f"Marked {count} expired slots as abandoned")

    return count


async def process_auto_accepts(db: AsyncSession) -> int:
    """
    Process slots that should be auto-accepted (background job)

    Args:
        db: Database session

    Returns:
        Number of slots auto-accepted
    """
    now = datetime.utcnow()

    # Find submitted slots past auto-accept deadline
    query = select(ReviewSlot).where(
        and_(
            ReviewSlot.status == ReviewSlotStatus.SUBMITTED.value,
            ReviewSlot.auto_accept_at < now
        )
    ).options(selectinload(ReviewSlot.review_request))

    result = await db.execute(query)
    auto_accept_slots = list(result.scalars().all())

    count = 0
    for slot in auto_accept_slots:
        try:
            slot.accept(is_auto=True)

            # Update review request
            request = slot.review_request
            if request:
                request.reviews_completed += 1

                # Check if all requested reviews are completed
                if request.reviews_completed >= request.reviews_requested:
                    request.status = "completed"
                    request.completed_at = datetime.utcnow()

            count += 1
        except Exception as e:
            logger.error(f"Error auto-accepting slot {slot.id}: {e}")

    if count > 0:
        await db.commit()
        logger.info(f"Auto-accepted {count} review slots")

    return count
