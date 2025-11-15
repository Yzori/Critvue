"""CRUD operations for review requests"""

from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.models.review_request import ReviewRequest, ReviewStatus
from app.models.review_file import ReviewFile
from app.schemas.review import ReviewRequestCreate, ReviewRequestUpdate, ReviewFileCreate
from app.utils.file_utils import delete_files_for_review


class ReviewCRUD:
    """CRUD operations for review requests"""

    @staticmethod
    async def create_review_request(
        db: AsyncSession,
        user_id: int,
        data: ReviewRequestCreate
    ) -> ReviewRequest:
        """
        Create a new review request and automatically create review slots

        Args:
            db: Database session
            user_id: ID of the user creating the review
            data: Review request data

        Returns:
            Created review request with slots

        Raises:
            Exception: If database operation fails
        """
        try:
            review = ReviewRequest(
                user_id=user_id,
                title=data.title,
                description=data.description,
                content_type=data.content_type,
                review_type=data.review_type,
                status=data.status,
                feedback_areas=data.feedback_areas,
                budget=data.budget,
                deadline=data.deadline,
                reviews_requested=data.reviews_requested
            )
            db.add(review)
            await db.commit()
            await db.refresh(review)

            # Automatically create review slots if status is pending or in_review
            if review.status in [ReviewStatus.PENDING, "in_review"]:
                from app.crud import review_slot as crud_review_slot
                from decimal import Decimal
                from app.models.review_request import ReviewType

                # Calculate payment amount per slot for expert reviews
                payment_amount = None
                if review.review_type == ReviewType.EXPERT and review.budget:
                    # Divide budget equally among requested reviews
                    payment_amount = Decimal(review.budget) / Decimal(review.reviews_requested)

                # Create slots
                await crud_review_slot.create_review_slots(
                    db,
                    review.id,
                    review.reviews_requested,
                    payment_amount
                )

                # Refresh to get slots relationship
                await db.refresh(review)

            return review
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def get_review_request(
        db: AsyncSession,
        review_id: int,
        user_id: Optional[int] = None
    ) -> Optional[ReviewRequest]:
        """
        Get a review request by ID

        Args:
            db: Database session
            review_id: ID of the review request
            user_id: Optional user ID to verify ownership

        Returns:
            Review request or None if not found

        Raises:
            Exception: If database operation fails
        """
        try:
            query = select(ReviewRequest).options(
                selectinload(ReviewRequest.files),
                selectinload(ReviewRequest.slots),
                selectinload(ReviewRequest.user)
            ).where(
                ReviewRequest.id == review_id,
                ReviewRequest.deleted_at.is_(None)
            )

            # Add ownership check if user_id is provided
            if user_id is not None:
                query = query.where(ReviewRequest.user_id == user_id)

            result = await db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            raise e

    @staticmethod
    async def get_user_review_requests(
        db: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 10,
        status: Optional[ReviewStatus] = None
    ) -> Tuple[List[ReviewRequest], int]:
        """
        Get review requests for a specific user with pagination

        Args:
            db: Database session
            user_id: ID of the user
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Optional status filter

        Returns:
            Tuple of (list of review requests, total count)

        Raises:
            Exception: If database operation fails
        """
        try:
            # Build base query
            query = select(ReviewRequest).options(
                selectinload(ReviewRequest.files)
            ).where(
                ReviewRequest.user_id == user_id,
                ReviewRequest.deleted_at.is_(None)
            )

            # Add status filter if provided
            if status is not None:
                query = query.where(ReviewRequest.status == status)

            # Order by most recent first
            query = query.order_by(ReviewRequest.created_at.desc())

            # Get total count
            count_query = select(func.count()).select_from(ReviewRequest).where(
                ReviewRequest.user_id == user_id,
                ReviewRequest.deleted_at.is_(None)
            )
            if status is not None:
                count_query = count_query.where(ReviewRequest.status == status)

            total_result = await db.execute(count_query)
            total = total_result.scalar()

            # Apply pagination
            query = query.offset(skip).limit(limit)

            result = await db.execute(query)
            reviews = result.scalars().all()

            return list(reviews), total
        except Exception as e:
            raise e

    @staticmethod
    async def update_review_request(
        db: AsyncSession,
        review_id: int,
        user_id: int,
        data: ReviewRequestUpdate
    ) -> Optional[ReviewRequest]:
        """
        Update a review request

        Args:
            db: Database session
            review_id: ID of the review request
            user_id: ID of the user (for ownership verification)
            data: Update data

        Returns:
            Updated review request or None if not found

        Raises:
            Exception: If database operation fails or user is not the owner
        """
        try:
            # Get the review with ownership check
            review = await ReviewCRUD.get_review_request(db, review_id, user_id)
            if not review:
                return None

            # Store original status for comparison
            original_status = review.status

            # Check if review is editable
            if not review.is_editable:
                raise ValueError(
                    f"Cannot edit review in '{review.status.value}' status. "
                    "Only draft and pending reviews can be edited."
                )

            # Validate status transitions
            if data.status is not None and data.status != original_status:
                # Define allowed status transitions
                ALLOWED_TRANSITIONS = {
                    ReviewStatus.DRAFT: {ReviewStatus.PENDING, ReviewStatus.CANCELLED},
                    ReviewStatus.PENDING: {ReviewStatus.IN_REVIEW, ReviewStatus.CANCELLED},
                    ReviewStatus.IN_REVIEW: {ReviewStatus.COMPLETED, ReviewStatus.CANCELLED},
                }

                allowed = ALLOWED_TRANSITIONS.get(original_status, set())
                if data.status not in allowed:
                    raise ValueError(
                        f"Invalid status transition from '{original_status.value}' to '{data.status.value}'. "
                        f"Allowed transitions: {[s.value for s in allowed]}"
                    )

            # Validate reviews_requested if being updated
            if data.reviews_requested is not None:
                if data.reviews_requested < review.reviews_claimed:
                    raise ValueError(
                        f"Cannot set reviews_requested ({data.reviews_requested}) below "
                        f"reviews_claimed ({review.reviews_claimed})"
                    )

            # Restrict editing of critical fields once review is pending
            if original_status == ReviewStatus.PENDING:
                critical_fields = {'review_type', 'reviews_requested', 'budget', 'content_type'}
                update_data_dict = data.model_dump(exclude_unset=True)
                attempting_critical_edit = bool(critical_fields & update_data_dict.keys())

                if attempting_critical_edit:
                    raise ValueError(
                        "Cannot modify review_type, reviews_requested, budget, or content_type "
                        "after review is pending. Only title, description, feedback_areas, and "
                        "deadline can be updated for pending reviews."
                    )

            # Update fields that are provided
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(review, field, value)

            # Update the updated_at timestamp
            review.updated_at = datetime.utcnow()

            # If status is being set to completed, set completed_at
            if data.status == ReviewStatus.COMPLETED and not review.completed_at:
                review.completed_at = datetime.utcnow()

            # CRITICAL FIX: Create review slots if transitioning to PENDING
            if data.status == ReviewStatus.PENDING and original_status != ReviewStatus.PENDING:
                # Check if slots already exist
                if not review.slots or len(review.slots) == 0:
                    from app.crud import review_slot as crud_review_slot
                    from decimal import Decimal
                    from app.models.review_request import ReviewType

                    # Calculate payment amount per slot for expert reviews
                    payment_amount = None
                    if review.review_type == ReviewType.EXPERT and review.budget:
                        payment_amount = Decimal(review.budget) / Decimal(review.reviews_requested)

                    # Create review slots
                    await crud_review_slot.create_review_slots(
                        db,
                        review.id,
                        review.reviews_requested,
                        payment_amount
                    )

            await db.commit()
            await db.refresh(review)
            return review
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def delete_review_request(
        db: AsyncSession,
        review_id: int,
        user_id: int,
        soft_delete: bool = True
    ) -> bool:
        """
        Delete a review request (soft or hard delete)
        For hard deletes, also removes associated files from disk.

        Args:
            db: Database session
            review_id: ID of the review request
            user_id: ID of the user (for ownership verification)
            soft_delete: If True, soft delete (set deleted_at). If False, hard delete

        Returns:
            True if deleted, False if not found

        Raises:
            Exception: If database operation fails or user is not the owner
        """
        try:
            # Get the review with ownership check
            review = await ReviewCRUD.get_review_request(db, review_id, user_id)
            if not review:
                return False

            # Check for active claims or submitted reviews (prevent deletion)
            from sqlalchemy import select, func, and_
            from app.models.review_slot import ReviewSlot, ReviewSlotStatus

            active_slots_query = select(func.count(ReviewSlot.id)).where(
                and_(
                    ReviewSlot.review_request_id == review_id,
                    ReviewSlot.status.in_([
                        ReviewSlotStatus.CLAIMED.value,
                        ReviewSlotStatus.SUBMITTED.value
                    ])
                )
            )
            active_slots_result = await db.execute(active_slots_query)
            active_count = active_slots_result.scalar() or 0

            if active_count > 0:
                raise ValueError(
                    f"Cannot delete review request with {active_count} active claim(s) or "
                    "submitted review(s). Wait for reviewers to submit or abandon their claims."
                )

            if soft_delete:
                # Soft delete - don't remove files
                review.deleted_at = datetime.utcnow()
                await db.commit()
            else:
                # Hard delete - clean up files from disk
                if review.files:
                    file_paths = [f.file_path for f in review.files if f.file_path]
                    if file_paths:
                        # Delete files asynchronously (don't fail if file cleanup fails)
                        try:
                            await delete_files_for_review(file_paths)
                        except Exception as e:
                            # Log error but continue with database deletion
                            print(f"Error cleaning up files during hard delete: {type(e).__name__}")

                # Delete from database (cascade will handle related records)
                await db.delete(review)
                await db.commit()

            return True
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def add_file_to_review(
        db: AsyncSession,
        review_id: int,
        user_id: int,
        file_data: ReviewFileCreate
    ) -> Optional[ReviewFile]:
        """
        Add a file to a review request

        Args:
            db: Database session
            review_id: ID of the review request
            user_id: ID of the user (for ownership verification)
            file_data: File data

        Returns:
            Created review file or None if review not found

        Raises:
            Exception: If database operation fails or user is not the owner
        """
        try:
            # Verify review exists and user owns it
            review = await ReviewCRUD.get_review_request(db, review_id, user_id)
            if not review:
                return None

            # Create the file
            review_file = ReviewFile(
                review_request_id=review_id,
                filename=file_data.filename,
                original_filename=file_data.original_filename,
                file_size=file_data.file_size,
                file_type=file_data.file_type,
                file_url=file_data.file_url,
                file_path=file_data.file_path,
                content_hash=file_data.content_hash
            )

            db.add(review_file)
            await db.commit()
            await db.refresh(review_file)
            return review_file
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def claim_review_slot(
        db: AsyncSession,
        review_id: int,
        reviewer_id: int
    ) -> Optional[ReviewRequest]:
        """
        Claim a review slot for a review request.

        This operation uses database-level locking (SELECT FOR UPDATE) to prevent
        race conditions when multiple reviewers try to claim simultaneously.

        Args:
            db: Database session
            review_id: ID of the review request
            reviewer_id: ID of the user claiming the review

        Returns:
            Updated review request if successful, None if not found

        Raises:
            ValueError: If claim is invalid (fully claimed, own review, already claimed, etc.)
            Exception: If database operation fails
        """
        try:
            # Use SELECT FOR UPDATE to lock the row and prevent race conditions
            query = (
                select(ReviewRequest)
                .where(
                    ReviewRequest.id == review_id,
                    ReviewRequest.deleted_at.is_(None)
                )
                .with_for_update()  # Row-level lock
            )

            result = await db.execute(query)
            review = result.scalar_one_or_none()

            if not review:
                return None

            # Validation checks
            if review.user_id == reviewer_id:
                raise ValueError("You cannot claim your own review request")

            if review.status not in [ReviewStatus.PENDING, ReviewStatus.IN_REVIEW]:
                raise ValueError(
                    f"Cannot claim review with status '{review.status.value}'. "
                    "Only pending or in-review requests can be claimed."
                )

            if review.is_fully_claimed:
                raise ValueError(
                    "All review slots are already claimed. "
                    f"{review.reviews_claimed}/{review.reviews_requested} slots filled."
                )

            # Check if this reviewer has already claimed a slot
            # For now, we allow multiple slots per reviewer since we don't have a claims table
            # In a future enhancement, we could add a review_claims table to track individual claims

            # Increment reviews_claimed
            review.reviews_claimed += 1

            # If this was the first claim, change status to IN_REVIEW
            if review.reviews_claimed == 1 and review.status == ReviewStatus.PENDING:
                review.status = ReviewStatus.IN_REVIEW

            # If all slots are now claimed, keep status as IN_REVIEW
            # (Will be changed to COMPLETED when actual reviews are submitted)

            review.updated_at = datetime.utcnow()

            await db.commit()
            await db.refresh(review)
            return review

        except ValueError:
            # Re-raise validation errors
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def unclaim_review_slot(
        db: AsyncSession,
        review_id: int,
        reviewer_id: int
    ) -> Optional[ReviewRequest]:
        """
        Unclaim a review slot (e.g., if reviewer decides not to proceed).

        Args:
            db: Database session
            review_id: ID of the review request
            reviewer_id: ID of the user unclaiming the review

        Returns:
            Updated review request if successful, None if not found

        Raises:
            ValueError: If unclaim is invalid
            Exception: If database operation fails
        """
        try:
            # Use SELECT FOR UPDATE to lock the row
            query = (
                select(ReviewRequest)
                .where(
                    ReviewRequest.id == review_id,
                    ReviewRequest.deleted_at.is_(None)
                )
                .with_for_update()
            )

            result = await db.execute(query)
            review = result.scalar_one_or_none()

            if not review:
                return None

            # Validation checks
            if review.reviews_claimed == 0:
                raise ValueError("No slots are claimed for this review request")

            if review.status == ReviewStatus.COMPLETED:
                raise ValueError("Cannot unclaim a completed review")

            # Decrement reviews_claimed
            review.reviews_claimed -= 1

            # If no slots are claimed, change status back to PENDING
            if review.reviews_claimed == 0:
                review.status = ReviewStatus.PENDING

            review.updated_at = datetime.utcnow()

            await db.commit()
            await db.refresh(review)
            return review

        except ValueError:
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def get_review_stats(
        db: AsyncSession,
        user_id: int
    ) -> dict:
        """
        Get statistics for a user's review requests

        Args:
            db: Database session
            user_id: ID of the user

        Returns:
            Dictionary with statistics

        Raises:
            Exception: If database operation fails
        """
        try:
            # Get counts by status
            query = select(
                ReviewRequest.status,
                func.count(ReviewRequest.id)
            ).where(
                ReviewRequest.user_id == user_id,
                ReviewRequest.deleted_at.is_(None)
            ).group_by(ReviewRequest.status)

            result = await db.execute(query)
            status_counts = dict(result.all())

            # Build stats dictionary
            stats = {
                "total_requests": sum(status_counts.values()),
                "draft_count": status_counts.get(ReviewStatus.DRAFT, 0),
                "pending_count": status_counts.get(ReviewStatus.PENDING, 0),
                "in_review_count": status_counts.get(ReviewStatus.IN_REVIEW, 0),
                "completed_count": status_counts.get(ReviewStatus.COMPLETED, 0),
                "cancelled_count": status_counts.get(ReviewStatus.CANCELLED, 0),
            }

            return stats
        except Exception as e:
            raise e


# Create a singleton instance
review_crud = ReviewCRUD()
