"""CRUD operations for public browse marketplace"""

from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload, joinedload

from app.models.review_request import ReviewRequest, ReviewStatus, ContentType, ReviewType
from app.models.user import User
from app.models.review_file import ReviewFile
from app.schemas.browse import (
    BrowseReviewItem,
    CreatorInfo,
    SortOption,
    DeadlineFilter,
    UrgencyLevel
)


class BrowseCRUD:
    """CRUD operations for public browse marketplace"""

    @staticmethod
    def _calculate_urgency(deadline: Optional[datetime]) -> UrgencyLevel:
        """
        Calculate urgency level based on deadline.

        Args:
            deadline: Review deadline (UTC)

        Returns:
            UrgencyLevel enum value
        """
        if deadline is None:
            return UrgencyLevel.FLEXIBLE

        now = datetime.utcnow()
        time_remaining = deadline - now

        if time_remaining <= timedelta(hours=24):
            return UrgencyLevel.URGENT
        elif time_remaining <= timedelta(days=7):
            return UrgencyLevel.THIS_WEEK
        elif time_remaining <= timedelta(days=30):
            return UrgencyLevel.THIS_MONTH
        else:
            return UrgencyLevel.FLEXIBLE

    @staticmethod
    def _parse_skills_needed(feedback_areas: Optional[str]) -> List[str]:
        """
        Parse skills needed from feedback_areas text.

        Args:
            feedback_areas: Comma-separated or newline-separated skills/areas

        Returns:
            List of skill strings
        """
        if not feedback_areas:
            return []

        # Split by comma or newline, strip whitespace, filter empty
        skills = [
            skill.strip()
            for skill in feedback_areas.replace('\n', ',').split(',')
            if skill.strip()
        ]
        return skills[:10]  # Limit to 10 skills for performance

    @staticmethod
    def _calculate_match_score(
        user_skills: List[str],
        review_skills: List[str],
        content_type: Optional[str] = None
    ) -> int:
        """
        Calculate skill match score between user skills and review requirements.

        Algorithm:
        1. Normalize all skills to lowercase for comparison
        2. Calculate exact matches (70% weight)
        3. Calculate partial/fuzzy matches (20% weight)
        4. Add content type bonus (10% weight)
        5. Ensure minimum score of 30 if any match found

        Args:
            user_skills: List of user's specialty tags
            review_skills: List of skills needed for the review
            content_type: Review content type (for category matching)

        Returns:
            Match score from 0-100
        """
        if not user_skills or not review_skills:
            return 0

        # Normalize skills to lowercase
        user_skills_lower = {s.lower().strip() for s in user_skills}
        review_skills_lower = {s.lower().strip() for s in review_skills}

        # Calculate exact matches
        exact_matches = user_skills_lower & review_skills_lower
        exact_match_count = len(exact_matches)

        # Calculate partial/fuzzy matches (substring matches)
        partial_matches = 0
        for user_skill in user_skills_lower:
            for review_skill in review_skills_lower:
                if user_skill != review_skill:
                    # Check for substring match or related terms
                    if user_skill in review_skill or review_skill in user_skill:
                        partial_matches += 0.5
                    # Check for common prefixes (e.g., "react" matches "react native")
                    elif len(user_skill) > 3 and len(review_skill) > 3:
                        if user_skill[:4] == review_skill[:4]:
                            partial_matches += 0.3

        # Calculate base score
        total_review_skills = len(review_skills_lower)

        # Exact match contribution (70% weight, based on coverage of review skills)
        exact_score = (exact_match_count / total_review_skills) * 70 if total_review_skills > 0 else 0

        # Partial match contribution (20% weight, capped at 20)
        partial_score = min(partial_matches * 10, 20)

        # Content type bonus (10% weight)
        # Map content types to related skill keywords
        content_skill_map = {
            "design": ["design", "ui", "ux", "figma", "sketch", "adobe", "visual", "graphic", "prototype"],
            "photography": ["photography", "photo", "camera", "lightroom", "photoshop", "portrait", "landscape", "editing", "retouching", "composition"],
            "video": ["video", "editing", "premiere", "after effects", "motion", "animation", "davinci"],
            "audio": ["audio", "sound", "music", "podcast", "mixing", "mastering", "pro tools", "ableton"],
            "writing": ["writing", "copy", "content", "technical", "documentation", "editing", "seo"],
            "art": ["art", "illustration", "painting", "3d", "character", "concept", "digital art"]
        }

        content_bonus = 0
        if content_type and content_type.lower() in content_skill_map:
            related_keywords = content_skill_map[content_type.lower()]
            for user_skill in user_skills_lower:
                if any(keyword in user_skill for keyword in related_keywords):
                    content_bonus = 10
                    break

        # Calculate total score
        total_score = exact_score + partial_score + content_bonus

        # Ensure minimum score of 30 if any match found
        if exact_match_count > 0 or partial_matches > 0:
            total_score = max(total_score, 30)

        # Cap at 100
        return min(round(total_score), 100)

    @staticmethod
    async def get_public_reviews(
        db: AsyncSession,
        content_type: Optional[ContentType] = None,
        review_type: Optional[ReviewType] = None,
        sort_by: SortOption = SortOption.RECENT,
        deadline: Optional[DeadlineFilter] = None,
        limit: int = 50,
        offset: int = 0,
        user_skills: Optional[List[str]] = None,
        search: Optional[str] = None
    ) -> Tuple[List[BrowseReviewItem], int]:
        """
        Get public review requests for marketplace browsing.

        This method:
        1. Only shows reviews with status "pending" (open for claiming)
        2. Joins with User table for creator info
        3. Joins with ReviewFile table for preview images
        4. Applies filters for content_type, review_type, deadline
        5. Sorts according to sort_by parameter
        6. Implements pagination with limit and offset
        7. Excludes all sensitive user data

        Args:
            db: Database session
            content_type: Optional content type filter
            review_type: Optional review type filter
            sort_by: Sort option (recent, price_high, price_low, deadline)
            deadline: Optional deadline urgency filter
            limit: Number of results per page (max 100)
            offset: Pagination offset

        Returns:
            Tuple of (list of BrowseReviewItem, total count)

        Raises:
            Exception: If database operation fails
        """
        try:
            # Build base query - only show reviews with available slots
            # Join with User for creator info and ReviewFile for preview images
            query = (
                select(ReviewRequest)
                .join(User, ReviewRequest.user_id == User.id)
                .outerjoin(ReviewFile, ReviewRequest.id == ReviewFile.review_request_id)
                .options(
                    joinedload(ReviewRequest.user),
                    selectinload(ReviewRequest.files)
                )
                .where(
                    # Show pending OR in_review (if not fully claimed)
                    or_(
                        ReviewRequest.status == ReviewStatus.PENDING,
                        ReviewRequest.status == ReviewStatus.IN_REVIEW
                    ),
                    ReviewRequest.deleted_at.is_(None),
                    User.is_active == True,  # Only show reviews from active users
                    # CRITICAL: Only show reviews with available slots
                    # This filters out fully claimed reviews automatically
                    ReviewRequest.reviews_claimed < ReviewRequest.reviews_requested
                )
                .distinct()  # Prevent duplicates from ReviewFile join
            )

            # Apply content_type filter
            if content_type is not None:
                query = query.where(ReviewRequest.content_type == content_type)

            # Apply review_type filter
            if review_type is not None:
                query = query.where(ReviewRequest.review_type == review_type)

            # Apply search filter (case-insensitive search in title and description)
            if search:
                search_term = f"%{search.lower()}%"
                query = query.where(
                    or_(
                        func.lower(ReviewRequest.title).ilike(search_term),
                        func.lower(ReviewRequest.description).ilike(search_term)
                    )
                )

            # Apply deadline filter
            if deadline is not None:
                now = datetime.utcnow()

                if deadline == DeadlineFilter.URGENT:
                    # Less than 24 hours
                    deadline_cutoff = now + timedelta(hours=24)
                    query = query.where(
                        ReviewRequest.deadline.isnot(None),
                        ReviewRequest.deadline <= deadline_cutoff,
                        ReviewRequest.deadline > now
                    )
                elif deadline == DeadlineFilter.THIS_WEEK:
                    # Less than 7 days
                    deadline_cutoff = now + timedelta(days=7)
                    query = query.where(
                        ReviewRequest.deadline.isnot(None),
                        ReviewRequest.deadline <= deadline_cutoff,
                        ReviewRequest.deadline > now
                    )
                elif deadline == DeadlineFilter.THIS_MONTH:
                    # Less than 30 days
                    deadline_cutoff = now + timedelta(days=30)
                    query = query.where(
                        ReviewRequest.deadline.isnot(None),
                        ReviewRequest.deadline <= deadline_cutoff,
                        ReviewRequest.deadline > now
                    )
                elif deadline == DeadlineFilter.FLEXIBLE:
                    # More than 30 days or no deadline
                    deadline_cutoff = now + timedelta(days=30)
                    query = query.where(
                        or_(
                            ReviewRequest.deadline.is_(None),
                            ReviewRequest.deadline > deadline_cutoff
                        )
                    )

            # Build count query (before sorting and pagination)
            count_query = (
                select(func.count(func.distinct(ReviewRequest.id)))
                .select_from(ReviewRequest)
                .join(User, ReviewRequest.user_id == User.id)
                .where(
                    or_(
                        ReviewRequest.status == ReviewStatus.PENDING,
                        ReviewRequest.status == ReviewStatus.IN_REVIEW
                    ),
                    ReviewRequest.deleted_at.is_(None),
                    User.is_active == True,
                    # Only count reviews with available slots
                    ReviewRequest.reviews_claimed < ReviewRequest.reviews_requested
                )
            )

            # Apply same filters to count query
            if content_type is not None:
                count_query = count_query.where(ReviewRequest.content_type == content_type)
            if review_type is not None:
                count_query = count_query.where(ReviewRequest.review_type == review_type)
            if search:
                search_term = f"%{search.lower()}%"
                count_query = count_query.where(
                    or_(
                        func.lower(ReviewRequest.title).ilike(search_term),
                        func.lower(ReviewRequest.description).ilike(search_term)
                    )
                )

            # Apply deadline filter to count query
            if deadline is not None:
                now = datetime.utcnow()
                if deadline == DeadlineFilter.URGENT:
                    deadline_cutoff = now + timedelta(hours=24)
                    count_query = count_query.where(
                        ReviewRequest.deadline.isnot(None),
                        ReviewRequest.deadline <= deadline_cutoff,
                        ReviewRequest.deadline > now
                    )
                elif deadline == DeadlineFilter.THIS_WEEK:
                    deadline_cutoff = now + timedelta(days=7)
                    count_query = count_query.where(
                        ReviewRequest.deadline.isnot(None),
                        ReviewRequest.deadline <= deadline_cutoff,
                        ReviewRequest.deadline > now
                    )
                elif deadline == DeadlineFilter.THIS_MONTH:
                    deadline_cutoff = now + timedelta(days=30)
                    count_query = count_query.where(
                        ReviewRequest.deadline.isnot(None),
                        ReviewRequest.deadline <= deadline_cutoff,
                        ReviewRequest.deadline > now
                    )
                elif deadline == DeadlineFilter.FLEXIBLE:
                    deadline_cutoff = now + timedelta(days=30)
                    count_query = count_query.where(
                        or_(
                            ReviewRequest.deadline.is_(None),
                            ReviewRequest.deadline > deadline_cutoff
                        )
                    )

            # Get total count
            total_result = await db.execute(count_query)
            total = total_result.scalar()

            # Apply sorting
            if sort_by == SortOption.RECENT:
                query = query.order_by(ReviewRequest.created_at.desc())
            elif sort_by == SortOption.PRICE_HIGH:
                # Sort by budget DESC, nulls last (free reviews)
                query = query.order_by(
                    ReviewRequest.budget.desc().nullslast(),
                    ReviewRequest.created_at.desc()
                )
            elif sort_by == SortOption.PRICE_LOW:
                # Sort by budget ASC, nulls last (free reviews)
                query = query.order_by(
                    ReviewRequest.budget.asc().nullslast(),
                    ReviewRequest.created_at.desc()
                )
            elif sort_by == SortOption.DEADLINE:
                # Sort by deadline ASC, nulls last (no deadline)
                query = query.order_by(
                    ReviewRequest.deadline.asc().nullslast(),
                    ReviewRequest.created_at.desc()
                )

            # Apply pagination
            query = query.offset(offset).limit(limit)

            # Execute query
            result = await db.execute(query)
            reviews = result.unique().scalars().all()

            # Transform to BrowseReviewItem schema
            browse_items = []
            for review in reviews:
                # Build creator info (public data only)
                creator = CreatorInfo(
                    id=review.user.id,
                    full_name=review.user.full_name,
                    avatar_url=review.user.avatar_url
                )

                # Get preview image (first image file)
                preview_image = None
                if review.files:
                    image_files = [f for f in review.files if f.is_image]
                    if image_files:
                        # Use file_url if available, otherwise construct path
                        preview_file = image_files[0]
                        preview_image = preview_file.file_url or f"/files/{preview_file.file_path}"

                # Parse skills needed
                skills_needed = BrowseCRUD._parse_skills_needed(review.feedback_areas)

                # Calculate urgency
                urgency = BrowseCRUD._calculate_urgency(review.deadline)

                # Calculate match score if user skills provided
                match_score = None
                if user_skills:
                    match_score = BrowseCRUD._calculate_match_score(
                        user_skills=user_skills,
                        review_skills=skills_needed,
                        content_type=review.content_type.value if review.content_type else None
                    )

                # Build browse item
                browse_item = BrowseReviewItem(
                    id=review.id,
                    title=review.title,
                    description=review.description,
                    content_type=review.content_type,
                    review_type=review.review_type,
                    price=review.budget,  # Will be None for free reviews
                    deadline=review.deadline,
                    status=review.status,
                    created_at=review.created_at,
                    creator=creator,
                    preview_image=preview_image,
                    skills_needed=skills_needed,
                    urgency=urgency,
                    reviews_requested=review.reviews_requested,
                    reviews_claimed=review.reviews_claimed,
                    available_slots=review.available_slots,
                    match_score=match_score,
                    # Expert review tier fields (will be None for free reviews)
                    tier=review.tier,
                    feedback_priority=review.feedback_priority,
                    specific_questions=review.specific_questions,
                    context=review.context,
                    estimated_duration=review.estimated_duration,
                    # NDA field
                    requires_nda=review.requires_nda
                )
                browse_items.append(browse_item)

            return browse_items, total

        except Exception as e:
            raise e


# Create a singleton instance
browse_crud = BrowseCRUD()
