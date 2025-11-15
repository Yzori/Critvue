# Reviewer Workflow: Quick Implementation Guide

**Quick Start:** This guide provides ready-to-use code snippets for implementing the reviewer workflow.

**Prerequisites:** Read the full design document (`REVIEWER_WORKFLOW_DESIGN.md`) first.

---

## Phase 1: Critical Path Implementation

### 1. Prevent Multiple Claims Per Request

**File:** `/home/user/Critvue/backend/app/crud/review_slot.py`

Add this check to the existing `claim_review_slot()` function:

```python
async def claim_review_slot(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int,
    claim_hours: int = 72
) -> ReviewSlot:
    """Claim a review slot for a reviewer (with row-level locking)"""

    # Get slot with row lock to prevent race conditions
    slot = await get_review_slot_with_lock(db, slot_id)

    if not slot:
        raise RuntimeError(f"Review slot {slot_id} not found")

    # Check if slot is available
    if not slot.is_claimable:
        raise ValueError(f"Slot is not available (current status: {slot.status})")

    # ===== NEW: Check if reviewer already has a slot for this request =====
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
    # ===== END NEW =====

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
```

### 2. Prevent Request Deletion with Active Claims

**File:** `/home/user/Critvue/backend/app/crud/review.py`

Add this to the `delete_review_request()` function:

```python
async def delete_review_request(
    db: AsyncSession,
    review_id: int,
    user_id: int,
    soft_delete: bool = True
) -> bool:
    """Delete a review request (with active claim protection)"""

    request = await get_review_request(db, review_id, user_id)

    if not request:
        return False

    # ===== NEW: Check for active claims =====
    active_slots = await db.execute(
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.review_request_id == review_id,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.CLAIMED.value,
                    ReviewSlotStatus.SUBMITTED.value
                ])
            )
        )
    )

    if active_slots.scalar() > 0:
        raise ValueError(
            "Cannot delete review request with active claims. "
            "Wait for reviewers to submit or abandon their claims."
        )
    # ===== END NEW =====

    # Continue with existing delete logic...
    if soft_delete:
        request.deleted_at = datetime.utcnow()
    else:
        await db.delete(request)

    await db.commit()
    return True
```

### 3. Background Job Scheduler

**File:** `/home/user/Critvue/backend/app/core/scheduler.py` (NEW FILE)

```python
"""Background job scheduler for review workflow automation"""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_maker
from app.crud.review_slot import process_expired_claims, process_auto_accepts

logger = logging.getLogger(__name__)

# Initialize scheduler
scheduler = AsyncIOScheduler()


async def get_db_session() -> AsyncSession:
    """Get database session for background jobs"""
    async with async_session_maker() as session:
        yield session


def start_background_jobs():
    """
    Start all background jobs for review workflow

    Jobs:
    1. process_expired_claims - Every hour at :00
    2. process_auto_accepts - Every hour at :00
    """

    logger.info("Starting background job scheduler...")

    # Job 1: Process expired claims (every hour)
    scheduler.add_job(
        process_expired_claims_job,
        CronTrigger(minute=0),  # Run at :00 of every hour
        id='process_expired_claims',
        replace_existing=True,
        max_instances=1  # Prevent overlapping runs
    )
    logger.info("Scheduled job: process_expired_claims (hourly at :00)")

    # Job 2: Process auto-accepts (every hour)
    scheduler.add_job(
        process_auto_accepts_job,
        CronTrigger(minute=0),  # Run at :00 of every hour
        id='process_auto_accepts',
        replace_existing=True,
        max_instances=1
    )
    logger.info("Scheduled job: process_auto_accepts (hourly at :00)")

    # Start the scheduler
    scheduler.start()
    logger.info("Background job scheduler started successfully")


def stop_background_jobs():
    """Stop all background jobs gracefully"""
    logger.info("Stopping background job scheduler...")
    scheduler.shutdown(wait=True)
    logger.info("Background job scheduler stopped")


async def process_expired_claims_job():
    """
    Background job: Mark expired claims as abandoned

    Finds all slots where:
    - status = CLAIMED
    - claim_deadline < NOW()

    Actions:
    - Set status to ABANDONED
    - Decrement reviews_claimed counter
    - Log abandoned claims
    """
    try:
        async with async_session_maker() as db:
            count = await process_expired_claims(db)

            if count > 0:
                logger.info(f"✓ Abandoned {count} expired claim(s)")
            else:
                logger.debug("No expired claims to process")

    except Exception as e:
        logger.error(f"✗ Error in process_expired_claims job: {e}", exc_info=True)


async def process_auto_accepts_job():
    """
    Background job: Auto-accept submitted reviews after 7 days

    Finds all slots where:
    - status = SUBMITTED
    - auto_accept_at < NOW()

    Actions:
    - Set status to ACCEPTED
    - Set acceptance_type to AUTO
    - Release payment (if expert review)
    - Increment reviews_completed counter
    - Update request status if all reviews complete
    """
    try:
        async with async_session_maker() as db:
            count = await process_auto_accepts(db)

            if count > 0:
                logger.info(f"✓ Auto-accepted {count} review(s)")
            else:
                logger.debug("No reviews to auto-accept")

    except Exception as e:
        logger.error(f"✗ Error in process_auto_accepts job: {e}", exc_info=True)


# Manual trigger functions (for testing/admin)

async def trigger_expired_claims_now():
    """Manually trigger expired claims processing (for testing)"""
    logger.info("Manually triggering expired claims processing...")
    await process_expired_claims_job()


async def trigger_auto_accepts_now():
    """Manually trigger auto-accept processing (for testing)"""
    logger.info("Manually triggering auto-accept processing...")
    await process_auto_accepts_job()
```

**File:** `/home/user/Critvue/backend/app/main.py`

Add to the application startup:

```python
from app.core.scheduler import start_background_jobs, stop_background_jobs

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("Starting Critvue backend...")

    # Start background job scheduler
    start_background_jobs()

    logger.info("Critvue backend started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down Critvue backend...")

    # Stop background job scheduler
    stop_background_jobs()

    logger.info("Critvue backend shut down successfully")
```

**Dependencies:** Add to `requirements.txt`:
```
apscheduler==3.10.4
```

### 4. Reviewer Dashboard API

**File:** `/home/user/Critvue/backend/app/api/v1/reviewer.py` (NEW FILE)

```python
"""Reviewer-specific API endpoints"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus, PaymentStatus
from app.models.review_request import ReviewRequest
from app.schemas.review_slot import ReviewerSlotWithRequest, ReviewerEarnings

router = APIRouter(prefix="/reviewer", tags=["Reviewer"])


@router.get("/dashboard")
async def get_reviewer_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get reviewer dashboard data

    Returns:
    - active_claims: Slots currently claimed (not yet submitted)
    - submitted_reviews: Reviews awaiting acceptance/rejection
    - completed_reviews: Recent accepted reviews (last 10)
    - stats: Reviewer statistics
    """

    # Get active claims (CLAIMED status)
    active_claims_query = (
        select(ReviewSlot)
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.CLAIMED.value
            )
        )
        .options(selectinload(ReviewSlot.review_request))
        .order_by(ReviewSlot.claim_deadline.asc())
    )
    active_claims_result = await db.execute(active_claims_query)
    active_claims = list(active_claims_result.scalars().all())

    # Get submitted reviews (SUBMITTED status)
    submitted_query = (
        select(ReviewSlot)
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.SUBMITTED.value
            )
        )
        .options(selectinload(ReviewSlot.review_request))
        .order_by(ReviewSlot.auto_accept_at.asc())
    )
    submitted_result = await db.execute(submitted_query)
    submitted_reviews = list(submitted_result.scalars().all())

    # Get completed reviews (ACCEPTED status, last 10)
    completed_query = (
        select(ReviewSlot)
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value
            )
        )
        .options(selectinload(ReviewSlot.review_request))
        .order_by(ReviewSlot.reviewed_at.desc())
        .limit(10)
    )
    completed_result = await db.execute(completed_query)
    completed_reviews = list(completed_result.scalars().all())

    # Calculate stats
    total_reviews_query = (
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.ACCEPTED.value,
                    ReviewSlotStatus.REJECTED.value
                ])
            )
        )
    )
    total_reviews_result = await db.execute(total_reviews_query)
    total_reviews = total_reviews_result.scalar() or 0

    accepted_reviews_query = (
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value
            )
        )
    )
    accepted_reviews_result = await db.execute(accepted_reviews_query)
    accepted_reviews = accepted_reviews_result.scalar() or 0

    acceptance_rate = accepted_reviews / total_reviews if total_reviews > 0 else 0

    # Average rating
    avg_rating_query = (
        select(func.avg(ReviewSlot.requester_helpful_rating))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.requester_helpful_rating.isnot(None)
            )
        )
    )
    avg_rating_result = await db.execute(avg_rating_query)
    average_rating = avg_rating_result.scalar() or None

    # Total earned (accepted reviews with payment)
    total_earned_query = (
        select(func.sum(ReviewSlot.payment_amount))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                ReviewSlot.payment_status == PaymentStatus.RELEASED.value
            )
        )
    )
    total_earned_result = await db.execute(total_earned_query)
    total_earned = total_earned_result.scalar() or 0

    # Pending payment (escrowed or submitted)
    pending_payment_query = (
        select(func.sum(ReviewSlot.payment_amount))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.CLAIMED.value,
                    ReviewSlotStatus.SUBMITTED.value
                ]),
                ReviewSlot.payment_status == PaymentStatus.ESCROWED.value
            )
        )
    )
    pending_payment_result = await db.execute(pending_payment_query)
    pending_payment = pending_payment_result.scalar() or 0

    # Format response
    return {
        "active_claims": [
            {
                "slot_id": slot.id,
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title,
                    "content_type": slot.review_request.content_type.value,
                    "review_type": slot.review_request.review_type.value,
                },
                "claimed_at": slot.claimed_at.isoformat() if slot.claimed_at else None,
                "claim_deadline": slot.claim_deadline.isoformat() if slot.claim_deadline else None,
                "payment_amount": float(slot.payment_amount) if slot.payment_amount else None,
            }
            for slot in active_claims
        ],
        "submitted_reviews": [
            {
                "slot_id": slot.id,
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title,
                    "content_type": slot.review_request.content_type.value,
                },
                "submitted_at": slot.submitted_at.isoformat() if slot.submitted_at else None,
                "auto_accept_at": slot.auto_accept_at.isoformat() if slot.auto_accept_at else None,
                "payment_amount": float(slot.payment_amount) if slot.payment_amount else None,
            }
            for slot in submitted_reviews
        ],
        "completed_reviews": [
            {
                "slot_id": slot.id,
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title,
                },
                "reviewed_at": slot.reviewed_at.isoformat() if slot.reviewed_at else None,
                "requester_helpful_rating": slot.requester_helpful_rating,
                "payment_amount": float(slot.payment_amount) if slot.payment_amount else None,
            }
            for slot in completed_reviews
        ],
        "stats": {
            "total_reviews": total_reviews,
            "accepted_reviews": accepted_reviews,
            "acceptance_rate": round(acceptance_rate, 3),
            "average_rating": round(average_rating, 2) if average_rating else None,
            "total_earned": float(total_earned),
            "pending_payment": float(pending_payment),
        }
    }


@router.get("/earnings", response_model=ReviewerEarnings)
async def get_reviewer_earnings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed earnings summary for reviewer"""

    # Total earned (released payments)
    total_earned_query = (
        select(func.sum(ReviewSlot.payment_amount))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.payment_status == PaymentStatus.RELEASED.value
            )
        )
    )
    total_earned_result = await db.execute(total_earned_query)
    total_earned = total_earned_result.scalar() or 0

    # Pending payment (escrowed)
    pending_payment_query = (
        select(func.sum(ReviewSlot.payment_amount))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.payment_status == PaymentStatus.ESCROWED.value
            )
        )
    )
    pending_payment_result = await db.execute(pending_payment_query)
    pending_payment = pending_payment_result.scalar() or 0

    # Reviews completed
    reviews_completed_query = (
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value
            )
        )
    )
    reviews_completed_result = await db.execute(reviews_completed_query)
    reviews_completed = reviews_completed_result.scalar() or 0

    # Average rating
    avg_rating_query = (
        select(func.avg(ReviewSlot.requester_helpful_rating))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.requester_helpful_rating.isnot(None)
            )
        )
    )
    avg_rating_result = await db.execute(avg_rating_query)
    average_rating = avg_rating_result.scalar()

    # Acceptance rate
    total_submitted_query = (
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.ACCEPTED.value,
                    ReviewSlotStatus.REJECTED.value
                ])
            )
        )
    )
    total_submitted_result = await db.execute(total_submitted_query)
    total_submitted = total_submitted_result.scalar() or 0

    acceptance_rate = reviews_completed / total_submitted if total_submitted > 0 else 0

    return ReviewerEarnings(
        total_earned=total_earned,
        pending_payment=pending_payment,
        available_for_withdrawal=total_earned,  # Simplified (in production, check withdrawal limits)
        reviews_completed=reviews_completed,
        average_rating=float(average_rating) if average_rating else None,
        acceptance_rate=acceptance_rate
    )
```

**Register the router in** `/home/user/Critvue/backend/app/api/v1/__init__.py`:

```python
from app.api.v1 import reviewer

# In the API router setup
app.include_router(reviewer.router, prefix="/api/v1")
```

### 5. Save Draft API

**File:** `/home/user/Critvue/backend/app/api/v1/review_slots.py`

Add this endpoint:

```python
@router.post(
    "/{slot_id}/save-draft",
    status_code=status.HTTP_200_OK
)
@limiter.limit("60/minute")  # Higher limit for auto-save
async def save_review_draft(
    request: Request,
    slot_id: int,
    draft_data: dict,  # {"draft_text": str, "draft_rating": int, "draft_attachments": list}
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save review draft (auto-save support)

    **Requirements:**
    - Slot must be in CLAIMED status
    - User must be the reviewer

    **Rate Limit:** 60 requests per minute (for auto-save)
    """
    try:
        # Get slot
        slot = await crud_review_slot.get_review_slot(db, slot_id)

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review slot not found"
            )

        # Verify ownership and status
        if slot.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only save drafts for your own claimed slots"
            )

        if slot.status != ReviewSlotStatus.CLAIMED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot save draft for slot in status '{slot.status}'"
            )

        # For MVP, store draft in review_slot itself (no separate table needed)
        # In production, you might want a separate review_drafts table

        # Store draft data (we'll use the existing fields but not change status)
        # This is a temporary storage that gets overwritten on actual submit

        import json
        slot.review_text = draft_data.get("draft_text", "")
        slot.rating = draft_data.get("draft_rating")
        slot.review_attachments = json.dumps(draft_data.get("draft_attachments", []))
        slot.updated_at = datetime.utcnow()

        await db.commit()

        logger.debug(f"Saved draft for slot {slot_id} by user {current_user.id}")

        return {
            "success": True,
            "last_saved_at": slot.updated_at.isoformat(),
            "message": "Draft saved successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving draft for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save draft"
        )


@router.get(
    "/{slot_id}/draft",
    status_code=status.HTTP_200_OK
)
@limiter.limit("30/minute")
async def get_review_draft(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get saved review draft

    **Requirements:**
    - Slot must be in CLAIMED status
    - User must be the reviewer

    **Rate Limit:** 30 requests per minute
    """
    try:
        slot = await crud_review_slot.get_review_slot(db, slot_id)

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review slot not found"
            )

        if slot.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access drafts for your own claimed slots"
            )

        if slot.status != ReviewSlotStatus.CLAIMED.value:
            return {
                "has_draft": False,
                "message": "No draft available for this slot status"
            }

        import json

        # Return draft if it exists
        has_content = bool(slot.review_text and len(slot.review_text.strip()) > 0)

        return {
            "has_draft": has_content,
            "draft_text": slot.review_text if has_content else "",
            "draft_rating": slot.rating,
            "draft_attachments": json.loads(slot.review_attachments) if slot.review_attachments else [],
            "last_saved_at": slot.updated_at.isoformat() if has_content else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting draft for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve draft"
        )
```

---

## Frontend Implementation Snippets

### 1. Claim Button Component

**File:** `/home/user/Critvue/frontend/components/browse/claim-button.tsx` (NEW)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { claimReviewSlot } from "@/lib/api/review-slots";
import { Loader2 } from "lucide-react";

interface ClaimButtonProps {
  slotId: number;
  reviewTitle: string;
  paymentAmount?: number;
  claimDeadlineHours?: number;
  disabled?: boolean;
}

export function ClaimButton({
  slotId,
  reviewTitle,
  paymentAmount,
  claimDeadlineHours = 72,
  disabled = false
}: ClaimButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClaim = async () => {
    try {
      setIsLoading(true);
      await claimReviewSlot(slotId);

      // Redirect to review writing page
      router.push(`/dashboard/reviews/${slotId}/write`);
    } catch (error: any) {
      console.error("Claim failed:", error);
      alert(error.response?.data?.detail || "Failed to claim review");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowConfirm(true)}
        disabled={disabled || isLoading}
        className="w-full bg-accent-blue hover:bg-accent-blue/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Claiming...
          </>
        ) : (
          "Claim This Review"
        )}
      </Button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-xl font-bold">Claim Review?</h3>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>You're about to claim:</p>
              <p className="font-semibold text-foreground">{reviewTitle}</p>

              <div className="pt-2 space-y-1">
                <p>⏰ You have <strong>{claimDeadlineHours} hours</strong> to submit your review</p>
                {paymentAmount && (
                  <p>💰 Payment: <strong>${paymentAmount.toFixed(2)}</strong></p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClaim}
                disabled={isLoading}
                className="flex-1 bg-accent-blue hover:bg-accent-blue/90"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Claim & Start"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### 2. Auto-Save Hook

**File:** `/home/user/Critvue/frontend/hooks/use-auto-save.ts` (NEW)

```typescript
import { useEffect, useRef } from "react";
import { saveDraft } from "@/lib/api/review-slots";

interface AutoSaveOptions {
  slotId: number;
  data: {
    draft_text: string;
    draft_rating: number | null;
    draft_attachments: any[];
  };
  delay?: number; // milliseconds
  enabled?: boolean;
}

export function useAutoSave({
  slotId,
  data,
  delay = 30000, // 30 seconds
  enabled = true
}: AutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Serialize data for comparison
    const currentData = JSON.stringify(data);

    // Only save if data changed
    if (currentData === lastSavedRef.current) {
      return;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveDraft(slotId, data);
        lastSavedRef.current = currentData;
        console.log("Draft auto-saved at", new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [slotId, data, delay, enabled]);
}
```

### 3. Review Writing Page

**File:** `/home/user/Critvue/frontend/app/dashboard/reviews/[slotId]/write/page.tsx` (NEW)

```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Save, Send, Clock } from "lucide-react";
import { useAutoSave } from "@/hooks/use-auto-save";
import {
  getReviewSlot,
  submitReview,
  getDraft,
  ReviewSlotResponse
} from "@/lib/api/review-slots";

export default function ReviewWritePage() {
  const params = useParams();
  const router = useRouter();
  const slotId = parseInt(params.slotId as string);

  const [slot, setSlot] = useState<ReviewSlotResponse | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save hook
  useAutoSave({
    slotId,
    data: {
      draft_text: reviewText,
      draft_rating: rating,
      draft_attachments: attachments
    },
    enabled: slot?.status === "claimed"
  });

  // Load slot and draft
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load slot
        const slotData = await getReviewSlot(slotId);
        setSlot(slotData);

        // Load draft if exists
        const draft = await getDraft(slotId);
        if (draft.has_draft) {
          setReviewText(draft.draft_text);
          setRating(draft.draft_rating);
          setAttachments(draft.draft_attachments || []);
        }
      } catch (error) {
        console.error("Failed to load review data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slotId]);

  // Quality checks
  const qualityChecks = {
    minLength: reviewText.length >= 50,
    hasRating: rating !== null,
  };

  const canSubmit = Object.values(qualityChecks).every(Boolean);

  // Handle submit
  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);

      await submitReview(slotId, {
        review_text: reviewText,
        rating: rating!,
        attachments
      });

      router.push("/dashboard?success=review-submitted");
    } catch (error: any) {
      console.error("Submit failed:", error);
      alert(error.response?.data?.detail || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Deadline Timer */}
      {slot?.claim_deadline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="size-5 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">
              Deadline: {new Date(slot.claim_deadline).toLocaleString()}
            </p>
            <p className="text-sm text-amber-700">
              Submit your review before the deadline expires
            </p>
          </div>
        </div>
      )}

      {/* Review Form */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Write Your Review</h1>

        {/* Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`size-8 ${
                    rating && value <= rating
                      ? "fill-amber-500 text-amber-500"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Review</label>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your detailed review here..."
            className="min-h-[300px]"
          />
          <p className="text-xs text-muted-foreground">
            {reviewText.length} / 10,000 characters
          </p>
        </div>

        {/* Quality Checklist */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold">Quality Checklist</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span>{qualityChecks.minLength ? "✅" : "⭕"}</span>
              <span>Minimum 50 characters</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{qualityChecks.hasRating ? "✅" : "⭕"}</span>
              <span>Rating provided</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Send className="size-4 animate-pulse" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### Backend Testing

```bash
# Test claim prevention
curl -X POST http://localhost:8000/api/v1/review-slots/1/claim \
  -H "Authorization: Bearer <token>"

# Test multiple claims (should fail)
curl -X POST http://localhost:8000/api/v1/review-slots/2/claim \
  -H "Authorization: Bearer <token>"

# Test dashboard
curl http://localhost:8000/api/v1/reviewer/dashboard \
  -H "Authorization: Bearer <token>"

# Manually trigger background jobs (for testing)
# Add this endpoint temporarily in scheduler.py:
@router.post("/admin/trigger-jobs")
async def trigger_jobs():
    await trigger_expired_claims_now()
    await trigger_auto_accepts_now()
    return {"status": "triggered"}
```

### Frontend Testing

1. **Claim Flow**
   - Browse to /browse
   - Click "Claim Review" on a card
   - Verify confirmation modal shows
   - Confirm claim
   - Should redirect to /dashboard/reviews/{slotId}/write

2. **Review Writing**
   - Write review text (< 50 chars should disable submit)
   - Select rating
   - Wait 30 seconds (verify auto-save in console)
   - Refresh page (draft should persist)
   - Submit review

3. **Dashboard**
   - Visit /dashboard
   - Should see claimed review in "Active Claims"
   - After submit, should move to "Submitted Reviews"
   - After acceptance, should move to "Completed Reviews"

---

## Deployment Notes

### Production Checklist

- [ ] Set up APScheduler or Celery in production
- [ ] Configure cron jobs to run hourly
- [ ] Set up monitoring for background jobs (e.g., Datadog, New Relic)
- [ ] Configure Stripe Connect for payments
- [ ] Set up email notifications (SendGrid, AWS SES)
- [ ] Add logging for all state transitions
- [ ] Set up alerts for high rejection rates
- [ ] Configure rate limiting (Redis-backed for multi-server)
- [ ] Test background jobs in staging environment
- [ ] Document escalation procedures for payment failures

### Environment Variables

```bash
# Add to .env
APSCHEDULER_ENABLED=true
CLAIM_DEADLINE_HOURS=72
AUTO_ACCEPT_DAYS=7
DISPUTE_WINDOW_DAYS=7
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Next Steps

1. **Phase 1 Backend** (Week 1)
   - [ ] Implement multiple claim prevention
   - [ ] Implement request deletion protection
   - [ ] Set up background job scheduler
   - [ ] Add reviewer dashboard endpoint
   - [ ] Add save draft endpoints
   - [ ] Test all endpoints with Postman/curl

2. **Phase 1 Frontend** (Week 2)
   - [ ] Build claim button component
   - [ ] Build review writing page
   - [ ] Implement auto-save
   - [ ] Build reviewer dashboard page
   - [ ] Test full flow end-to-end

3. **Phase 2** (Week 3-4)
   - [ ] Integrate payment system
   - [ ] Build earnings dashboard
   - [ ] Add quality validation
   - [ ] Implement admin dispute panel

**Total Timeline:** 4-6 weeks to production MVP

---

## Support

For questions or issues:
- See full design: `REVIEWER_WORKFLOW_DESIGN.md`
- Backend API docs: `/docs` (FastAPI auto-generated)
- Frontend components: Storybook (if set up)
