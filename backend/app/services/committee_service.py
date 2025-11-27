"""Committee Service for expert application review workflow"""

import logging
from datetime import datetime, timedelta
from math import ceil
from typing import Optional
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User, UserRole, UserTier
from app.models.expert_application import ExpertApplication, ApplicationStatus
from app.models.committee_member import CommitteeMember, CommitteeRole
from app.models.rejection_reason import RejectionReason
from app.models.application_review import ApplicationReview, ReviewStatus, Vote
from app.schemas.committee import (
    VoteRequest,
    ApplicationQueueItem,
    ApplicationDetailForReview,
    ApplicationReviewResponse,
    VotingStatus,
    DecisionResult,
    CommitteeStats,
)
from app.models.notification import NotificationType, NotificationPriority
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

# Constants
REAPPLICATION_COOLDOWN_DAYS = 90  # 3 months
ESCALATION_DAYS = 7  # Auto-escalate after 7 days


class CommitteeService:
    """Service for managing committee review workflow"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ============ Committee Member Management ============

    async def get_committee_member(self, user_id: int) -> Optional[CommitteeMember]:
        """Get committee member by user ID"""
        stmt = select(CommitteeMember).where(
            CommitteeMember.user_id == user_id,
            CommitteeMember.is_active == True
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_committee_count(self) -> int:
        """Get count of active committee members"""
        stmt = select(func.count(CommitteeMember.id)).where(
            CommitteeMember.is_active == True
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def get_committee_member_current_claims(self, member_id: int) -> int:
        """Get count of currently claimed (not voted) applications for a member"""
        stmt = select(func.count(ApplicationReview.id)).where(
            ApplicationReview.reviewer_id == member_id,
            ApplicationReview.status == ReviewStatus.CLAIMED.value.value
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    # ============ Queue Management ============

    async def get_application_queue(
        self,
        page: int = 1,
        page_size: int = 20,
        include_escalated_only: bool = False
    ) -> tuple[list[ApplicationQueueItem], int]:
        """Get applications waiting for review (submitted or resubmitted)"""
        escalation_cutoff = datetime.utcnow() - timedelta(days=ESCALATION_DAYS)

        # Base query for unclaimed submitted applications
        base_conditions = [
            ExpertApplication.status.in_([
                ApplicationStatus.SUBMITTED.value,
                ApplicationStatus.RESUBMITTED.value
            ])
        ]

        # Count subquery for how many times an app has been claimed
        claim_count_subq = (
            select(
                ApplicationReview.application_id,
                func.count(ApplicationReview.id).label('claim_count')
            )
            .group_by(ApplicationReview.application_id)
            .subquery()
        )

        # Applications that have no active claims
        active_claim_subq = (
            select(ApplicationReview.application_id)
            .where(ApplicationReview.status == ReviewStatus.CLAIMED.value)
        )

        base_conditions.append(
            ~ExpertApplication.id.in_(active_claim_subq)
        )

        if include_escalated_only:
            base_conditions.append(
                ExpertApplication.submitted_at <= escalation_cutoff
            )

        # Count total
        count_stmt = select(func.count(ExpertApplication.id)).where(*base_conditions)
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Fetch applications
        stmt = (
            select(
                ExpertApplication,
                func.coalesce(claim_count_subq.c.claim_count, 0).label('claim_count')
            )
            .outerjoin(
                claim_count_subq,
                ExpertApplication.id == claim_count_subq.c.application_id
            )
            .where(*base_conditions)
            .order_by(ExpertApplication.submitted_at.asc())  # Oldest first
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        queue_items = []
        now = datetime.utcnow()
        for row in rows:
            app = row[0]
            claim_count = row[1]
            days_in_queue = (now - app.submitted_at).days if app.submitted_at else 0

            queue_items.append(ApplicationQueueItem(
                id=app.id,
                application_number=app.application_number or f"APP-{app.id}",
                email=app.email,
                full_name=app.full_name,
                status=app.status.value,
                submitted_at=app.submitted_at,
                created_at=app.created_at,
                days_in_queue=days_in_queue,
                is_escalated=days_in_queue >= ESCALATION_DAYS,
                claim_count=claim_count
            ))

        return queue_items, total

    # ============ Claim/Release Applications ============

    async def claim_application(
        self,
        application_id: int,
        committee_member: CommitteeMember
    ) -> ApplicationReview:
        """Claim an application for review"""
        # Check member's current claims
        current_claims = await self.get_committee_member_current_claims(committee_member.id)
        if current_claims >= committee_member.max_concurrent_reviews:
            raise ValueError(
                f"You have reached your maximum concurrent reviews ({committee_member.max_concurrent_reviews})"
            )

        # Get application
        app_stmt = select(ExpertApplication).where(ExpertApplication.id == application_id)
        app_result = await self.db.execute(app_stmt)
        application = app_result.scalar_one_or_none()

        if not application:
            raise ValueError("Application not found")

        if application.status not in [ApplicationStatus.SUBMITTED.value, ApplicationStatus.RESUBMITTED.value]:
            raise ValueError(f"Application is not available for review (status: {application.status})")

        # Check if already claimed by someone else
        existing_claim_stmt = select(ApplicationReview).where(
            ApplicationReview.application_id == application_id,
            ApplicationReview.status == ReviewStatus.CLAIMED.value
        )
        existing_result = await self.db.execute(existing_claim_stmt)
        existing_claim = existing_result.scalar_one_or_none()

        if existing_claim:
            raise ValueError("Application is already claimed by another reviewer")

        # Check if this member already voted on this application
        already_voted_stmt = select(ApplicationReview).where(
            ApplicationReview.application_id == application_id,
            ApplicationReview.reviewer_id == committee_member.id,
            ApplicationReview.status == ReviewStatus.VOTED.value
        )
        already_voted_result = await self.db.execute(already_voted_stmt)
        if already_voted_result.scalar_one_or_none():
            raise ValueError("You have already voted on this application")

        # Create the review/claim
        review = ApplicationReview(
            application_id=application_id,
            reviewer_id=committee_member.id,
            status=ReviewStatus.CLAIMED,
            claimed_at=datetime.utcnow()
        )
        self.db.add(review)

        # Update application status to UNDER_REVIEW
        application.status = ApplicationStatus.UNDER_REVIEW.value
        application.updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(review)

        logger.info(f"Application {application_id} claimed by committee member {committee_member.id}")
        return review

    async def release_application(
        self,
        application_id: int,
        committee_member: CommitteeMember,
        reason: Optional[str] = None
    ) -> None:
        """Release a claimed application back to the queue"""
        # Find the active claim
        stmt = select(ApplicationReview).where(
            ApplicationReview.application_id == application_id,
            ApplicationReview.reviewer_id == committee_member.id,
            ApplicationReview.status == ReviewStatus.CLAIMED.value
        )
        result = await self.db.execute(stmt)
        review = result.scalar_one_or_none()

        if not review:
            raise ValueError("You don't have an active claim on this application")

        # Update review status
        review.status = ReviewStatus.RELEASED
        review.released_at = datetime.utcnow()
        if reason:
            review.internal_notes = f"Released: {reason}"

        # Check if there are other active reviews
        other_reviews_stmt = select(func.count(ApplicationReview.id)).where(
            ApplicationReview.application_id == application_id,
            ApplicationReview.status.in_([ReviewStatus.CLAIMED, ReviewStatus.VOTED]),
            ApplicationReview.id != review.id
        )
        other_result = await self.db.execute(other_reviews_stmt)
        other_count = other_result.scalar() or 0

        # If no other reviews, revert application status
        if other_count == 0:
            app_stmt = select(ExpertApplication).where(ExpertApplication.id == application_id)
            app_result = await self.db.execute(app_stmt)
            application = app_result.scalar_one_or_none()
            if application and application.status == ApplicationStatus.UNDER_REVIEW.value:
                application.status = ApplicationStatus.SUBMITTED.value
                application.updated_at = datetime.utcnow()

        await self.db.commit()
        logger.info(f"Application {application_id} released by committee member {committee_member.id}")

    # ============ Voting ============

    async def submit_vote(
        self,
        application_id: int,
        committee_member: CommitteeMember,
        vote_request: VoteRequest
    ) -> tuple[ApplicationReview, Optional[DecisionResult]]:
        """Submit a vote on an application"""
        # Find the active claim
        stmt = select(ApplicationReview).where(
            ApplicationReview.application_id == application_id,
            ApplicationReview.reviewer_id == committee_member.id,
            ApplicationReview.status == ReviewStatus.CLAIMED.value
        )
        result = await self.db.execute(stmt)
        review = result.scalar_one_or_none()

        if not review:
            raise ValueError("You don't have an active claim on this application")

        # Validate rejection reason if rejecting
        if vote_request.vote == Vote.REJECT.value and not vote_request.rejection_reason_id:
            raise ValueError("Rejection reason is required when rejecting")

        if vote_request.rejection_reason_id:
            reason_stmt = select(RejectionReason).where(
                RejectionReason.id == vote_request.rejection_reason_id,
                RejectionReason.is_active == True
            )
            reason_result = await self.db.execute(reason_stmt)
            if not reason_result.scalar_one_or_none():
                raise ValueError("Invalid rejection reason")

        # Update the review with the vote
        review.status = ReviewStatus.VOTED
        review.vote = vote_request.vote
        review.rejection_reason_id = vote_request.rejection_reason_id
        review.additional_feedback = vote_request.additional_feedback
        review.internal_notes = vote_request.internal_notes
        review.voted_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(review)

        # Check if decision threshold reached
        decision_result = await self._check_and_apply_decision(application_id, committee_member)

        logger.info(
            f"Vote submitted: Application {application_id}, "
            f"Member {committee_member.id}, Vote: {vote_request.vote}"
        )

        return review, decision_result

    async def _check_and_apply_decision(
        self,
        application_id: int,
        triggering_member: CommitteeMember
    ) -> Optional[DecisionResult]:
        """Check if voting threshold is reached and apply decision"""
        # Get the application
        app_stmt = select(ExpertApplication).where(ExpertApplication.id == application_id)
        app_result = await self.db.execute(app_stmt)
        application = app_result.scalar_one_or_none()

        if not application:
            return None

        # Get all votes on this application
        votes_stmt = select(ApplicationReview).where(
            ApplicationReview.application_id == application_id,
            ApplicationReview.status == ReviewStatus.VOTED.value
        ).options(selectinload(ApplicationReview.reviewer))
        votes_result = await self.db.execute(votes_stmt)
        reviews = votes_result.scalars().all()

        # Check for admin vote (instant decision)
        for review in reviews:
            if review.reviewer.role == CommitteeRole.ADMIN.value:
                if review.vote == Vote.APPROVE.value:
                    return await self._apply_approval(application, reviews)
                elif review.vote == Vote.REJECT.value:
                    return await self._apply_rejection(application, reviews)
                elif review.vote == Vote.REQUEST_CHANGES.value:
                    return await self._apply_request_changes(application, reviews)

        # Committee consensus (2/3 majority)
        total_committee = await self.get_active_committee_count()
        required = ceil(total_committee * 2 / 3)

        approve_count = sum(1 for r in reviews if r.vote == Vote.APPROVE.value)
        reject_count = sum(1 for r in reviews if r.vote == Vote.REJECT.value)
        request_changes_count = sum(1 for r in reviews if r.vote == Vote.REQUEST_CHANGES.value)

        if approve_count >= required:
            return await self._apply_approval(application, reviews)
        elif reject_count >= required:
            return await self._apply_rejection(application, reviews)
        elif request_changes_count >= required:
            return await self._apply_request_changes(application, reviews)

        return None  # No decision yet

    async def _apply_approval(
        self,
        application: ExpertApplication,
        reviews: list[ApplicationReview]
    ) -> DecisionResult:
        """Apply approval decision"""
        application.status = ApplicationStatus.APPROVED.value
        application.decided_at = datetime.utcnow()
        application.assigned_tier = "expert"  # Default tier, can be upgraded later

        # Upgrade the user to reviewer role
        user_stmt = select(User).where(User.id == application.user_id)
        user_result = await self.db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if user:
            user.role = UserRole.REVIEWER
            user.expert_application_approved = True
            user.user_tier = UserTier.EXPERT

        await self.db.commit()

        logger.info(f"Application {application.id} APPROVED, user {application.user_id} upgraded to REVIEWER")

        # Send approval notification
        try:
            notification_service = NotificationService(self.db)
            await notification_service.create_notification(
                user_id=application.user_id,
                notification_type=NotificationType.EXPERT_APPLICATION_APPROVED,
                title="Application Approved!",
                message="Congratulations! Your expert reviewer application has been approved. You can now start reviewing work on Critvue.",
                priority=NotificationPriority.HIGH,
                action_url="/reviewer/hub",
                action_label="Start Reviewing",
            )
            logger.info(f"Sent approval notification to user {application.user_id}")
        except Exception as e:
            logger.error(f"Failed to send approval notification: {e}")

        return DecisionResult(
            decision="approved",
            application_id=application.id,
            application_number=application.application_number or f"APP-{application.id}",
            assigned_tier=application.assigned_tier
        )

    async def _apply_rejection(
        self,
        application: ExpertApplication,
        reviews: list[ApplicationReview]
    ) -> DecisionResult:
        """Apply rejection decision"""
        application.status = ApplicationStatus.REJECTED.value
        application.decided_at = datetime.utcnow()
        application.last_rejection_at = datetime.utcnow()
        application.rejection_count += 1

        # Compile rejection summary from reviews
        rejection_summaries = []
        for review in reviews:
            if review.vote == Vote.REJECT.value and review.rejection_reason_id:
                reason_stmt = select(RejectionReason).where(
                    RejectionReason.id == review.rejection_reason_id
                )
                reason_result = await self.db.execute(reason_stmt)
                reason = reason_result.scalar_one_or_none()
                if reason and reason.applicant_message:
                    rejection_summaries.append(reason.applicant_message)
                if review.additional_feedback:
                    rejection_summaries.append(review.additional_feedback)

        application.rejection_summary = "\n\n".join(set(rejection_summaries)) if rejection_summaries else None

        await self.db.commit()

        logger.info(f"Application {application.id} REJECTED")

        # Send rejection notification
        try:
            notification_service = NotificationService(self.db)
            await notification_service.create_notification(
                user_id=application.user_id,
                notification_type=NotificationType.EXPERT_APPLICATION_REJECTED,
                title="Application Not Approved",
                message="We've reviewed your expert reviewer application and unfortunately cannot approve it at this time. Please check your application status for more details.",
                priority=NotificationPriority.HIGH,
                action_url="/apply/expert/status",
                action_label="View Details",
            )
            logger.info(f"Sent rejection notification to user {application.user_id}")
        except Exception as e:
            logger.error(f"Failed to send rejection notification: {e}")

        return DecisionResult(
            decision="rejected",
            application_id=application.id,
            application_number=application.application_number or f"APP-{application.id}",
            rejection_summary=application.rejection_summary
        )

    async def _apply_request_changes(
        self,
        application: ExpertApplication,
        reviews: list[ApplicationReview]
    ) -> DecisionResult:
        """Apply request changes decision"""
        application.status = ApplicationStatus.REQUEST_CHANGES.value
        application.updated_at = datetime.utcnow()

        # Compile feedback from reviews
        feedback_items = []
        for review in reviews:
            if review.vote == Vote.REQUEST_CHANGES.value and review.additional_feedback:
                feedback_items.append(review.additional_feedback)

        await self.db.commit()

        logger.info(f"Application {application.id} - changes requested")

        # Send changes requested notification
        try:
            notification_service = NotificationService(self.db)
            await notification_service.create_notification(
                user_id=application.user_id,
                notification_type=NotificationType.EXPERT_APPLICATION_UNDER_REVIEW,
                title="Changes Requested",
                message="Our review committee has requested some changes to your expert application. Please review the feedback and resubmit.",
                priority=NotificationPriority.HIGH,
                action_url="/apply/expert/status",
                action_label="View Feedback",
            )
            logger.info(f"Sent changes requested notification to user {application.user_id}")
        except Exception as e:
            logger.error(f"Failed to send changes requested notification: {e}")

        return DecisionResult(
            decision="request_changes",
            application_id=application.id,
            application_number=application.application_number or f"APP-{application.id}",
            rejection_summary="\n\n".join(feedback_items) if feedback_items else None
        )

    # ============ Application Details ============

    async def get_application_for_review(
        self,
        application_id: int
    ) -> Optional[ApplicationDetailForReview]:
        """Get full application details for committee review"""
        stmt = (
            select(ExpertApplication)
            .where(ExpertApplication.id == application_id)
            .options(selectinload(ExpertApplication.reviews))
        )
        result = await self.db.execute(stmt)
        application = result.scalar_one_or_none()

        if not application:
            return None

        # Get user info
        user_stmt = select(User).where(User.id == application.user_id)
        user_result = await self.db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        reviews_response = []
        for review in application.reviews:
            rejection_label = None
            if review.rejection_reason_id:
                reason_stmt = select(RejectionReason).where(
                    RejectionReason.id == review.rejection_reason_id
                )
                reason_result = await self.db.execute(reason_stmt)
                reason = reason_result.scalar_one_or_none()
                if reason:
                    rejection_label = reason.label

            reviews_response.append(ApplicationReviewResponse(
                id=review.id,
                application_id=review.application_id,
                reviewer_id=review.reviewer_id,
                status=review.status,
                vote=review.vote,
                rejection_reason_id=review.rejection_reason_id,
                additional_feedback=review.additional_feedback,
                internal_notes=review.internal_notes,
                claimed_at=review.claimed_at,
                voted_at=review.voted_at,
                released_at=review.released_at,
                rejection_reason_label=rejection_label
            ))

        return ApplicationDetailForReview(
            id=application.id,
            application_number=application.application_number or f"APP-{application.id}",
            email=application.email,
            full_name=application.full_name,
            status=application.status.value,
            application_data=application.application_data or {},
            submitted_at=application.submitted_at,
            created_at=application.created_at,
            updated_at=application.updated_at,
            user_id=application.user_id,
            user_joined_at=user.created_at if user else None,
            rejection_count=application.rejection_count,
            last_rejection_at=application.last_rejection_at,
            reviews=reviews_response
        )

    # ============ My Reviews ============

    async def get_my_reviews(
        self,
        committee_member: CommitteeMember
    ) -> dict:
        """Get committee member's claimed and recently voted applications"""
        # Get claimed applications
        claimed_stmt = (
            select(ApplicationReview)
            .where(
                ApplicationReview.reviewer_id == committee_member.id,
                ApplicationReview.status == ReviewStatus.CLAIMED.value
            )
            .options(selectinload(ApplicationReview.application))
        )
        claimed_result = await self.db.execute(claimed_stmt)
        claimed_reviews = claimed_result.scalars().all()

        claimed_details = []
        for review in claimed_reviews:
            detail = await self.get_application_for_review(review.application_id)
            if detail:
                claimed_details.append(detail)

        # Get recently voted (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        voted_stmt = (
            select(ApplicationReview)
            .where(
                ApplicationReview.reviewer_id == committee_member.id,
                ApplicationReview.status == ReviewStatus.VOTED.value,
                ApplicationReview.voted_at >= thirty_days_ago
            )
            .order_by(ApplicationReview.voted_at.desc())
            .limit(50)
        )
        voted_result = await self.db.execute(voted_stmt)
        voted_reviews = voted_result.scalars().all()

        # Count total voted
        total_voted_stmt = select(func.count(ApplicationReview.id)).where(
            ApplicationReview.reviewer_id == committee_member.id,
            ApplicationReview.status == ReviewStatus.VOTED.value
        )
        total_voted_result = await self.db.execute(total_voted_stmt)
        total_voted = total_voted_result.scalar() or 0

        voted_response = []
        for review in voted_reviews:
            rejection_label = None
            if review.rejection_reason_id:
                reason_stmt = select(RejectionReason).where(
                    RejectionReason.id == review.rejection_reason_id
                )
                reason_result = await self.db.execute(reason_stmt)
                reason = reason_result.scalar_one_or_none()
                if reason:
                    rejection_label = reason.label

            voted_response.append(ApplicationReviewResponse(
                id=review.id,
                application_id=review.application_id,
                reviewer_id=review.reviewer_id,
                status=review.status,
                vote=review.vote,
                rejection_reason_id=review.rejection_reason_id,
                additional_feedback=review.additional_feedback,
                internal_notes=review.internal_notes,
                claimed_at=review.claimed_at,
                voted_at=review.voted_at,
                released_at=review.released_at,
                rejection_reason_label=rejection_label
            ))

        return {
            "claimed": claimed_details,
            "voted": voted_response,
            "total_voted": total_voted
        }

    # ============ Rejection Reasons ============

    async def get_rejection_reasons(self, active_only: bool = True) -> list[RejectionReason]:
        """Get all rejection reasons"""
        conditions = []
        if active_only:
            conditions.append(RejectionReason.is_active == True)

        stmt = (
            select(RejectionReason)
            .where(*conditions)
            .order_by(RejectionReason.display_order)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    # ============ Stats ============

    async def get_committee_stats(
        self,
        committee_member: CommitteeMember
    ) -> CommitteeStats:
        """Get stats for committee dashboard"""
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Pending applications
        pending_stmt = select(func.count(ExpertApplication.id)).where(
            ExpertApplication.status.in_([
                ApplicationStatus.SUBMITTED.value,
                ApplicationStatus.RESUBMITTED.value
            ])
        )
        pending_result = await self.db.execute(pending_stmt)
        pending = pending_result.scalar() or 0

        # Under review
        under_review_stmt = select(func.count(ExpertApplication.id)).where(
            ExpertApplication.status == ApplicationStatus.UNDER_REVIEW.value
        )
        under_review_result = await self.db.execute(under_review_stmt)
        under_review = under_review_result.scalar() or 0

        # Approved this month
        approved_stmt = select(func.count(ExpertApplication.id)).where(
            ExpertApplication.status == ApplicationStatus.APPROVED.value,
            ExpertApplication.decided_at >= month_start
        )
        approved_result = await self.db.execute(approved_stmt)
        approved = approved_result.scalar() or 0

        # Rejected this month
        rejected_stmt = select(func.count(ExpertApplication.id)).where(
            ExpertApplication.status == ApplicationStatus.REJECTED.value,
            ExpertApplication.decided_at >= month_start
        )
        rejected_result = await self.db.execute(rejected_stmt)
        rejected = rejected_result.scalar() or 0

        # Avg review time (for decided applications this month)
        # This is a simplified calculation
        avg_time_stmt = (
            select(
                func.avg(
                    func.julianday(ExpertApplication.decided_at) -
                    func.julianday(ExpertApplication.submitted_at)
                )
            )
            .where(
                ExpertApplication.status.in_([
                    ApplicationStatus.APPROVED.value,
                    ApplicationStatus.REJECTED.value
                ]),
                ExpertApplication.decided_at >= month_start,
                ExpertApplication.submitted_at.isnot(None)
            )
        )
        avg_time_result = await self.db.execute(avg_time_stmt)
        avg_time = avg_time_result.scalar() or 0

        # My claimed count
        my_claimed = await self.get_committee_member_current_claims(committee_member.id)

        # My votes this month
        my_votes_stmt = select(func.count(ApplicationReview.id)).where(
            ApplicationReview.reviewer_id == committee_member.id,
            ApplicationReview.status == ReviewStatus.VOTED.value,
            ApplicationReview.voted_at >= month_start
        )
        my_votes_result = await self.db.execute(my_votes_stmt)
        my_votes = my_votes_result.scalar() or 0

        return CommitteeStats(
            pending_applications=pending,
            under_review=under_review,
            approved_this_month=approved,
            rejected_this_month=rejected,
            avg_review_time_days=round(avg_time, 1),
            my_claimed_count=my_claimed,
            my_votes_this_month=my_votes
        )

    # ============ Re-application Check ============

    async def can_user_reapply(self, user_id: int) -> tuple[bool, Optional[datetime]]:
        """Check if user can submit a new application"""
        # Get last rejected application
        stmt = (
            select(ExpertApplication)
            .where(
                ExpertApplication.user_id == user_id,
                ExpertApplication.status == ApplicationStatus.REJECTED.value
            )
            .order_by(ExpertApplication.decided_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        last_rejection = result.scalar_one_or_none()

        if not last_rejection or not last_rejection.last_rejection_at:
            return True, None

        cooldown_end = last_rejection.last_rejection_at + timedelta(days=REAPPLICATION_COOLDOWN_DAYS)
        if datetime.utcnow() >= cooldown_end:
            return True, None

        return False, cooldown_end

    # ============ Auto-escalation (for background job) ============

    async def get_applications_needing_escalation(self) -> list[ExpertApplication]:
        """Get applications that need escalation (no activity for 7 days)"""
        escalation_cutoff = datetime.utcnow() - timedelta(days=ESCALATION_DAYS)

        # Applications that are under review but claim is stale
        stmt = (
            select(ExpertApplication)
            .join(ApplicationReview)
            .where(
                ExpertApplication.status == ApplicationStatus.UNDER_REVIEW.value,
                ApplicationReview.status == ReviewStatus.CLAIMED.value,
                ApplicationReview.claimed_at <= escalation_cutoff
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def auto_release_stale_claims(self) -> int:
        """Auto-release claims that are older than 7 days"""
        escalation_cutoff = datetime.utcnow() - timedelta(days=ESCALATION_DAYS)

        # Find stale claims
        stmt = select(ApplicationReview).where(
            ApplicationReview.status == ReviewStatus.CLAIMED.value,
            ApplicationReview.claimed_at <= escalation_cutoff
        )
        result = await self.db.execute(stmt)
        stale_reviews = result.scalars().all()

        released_count = 0
        for review in stale_reviews:
            review.status = ReviewStatus.RELEASED
            review.released_at = datetime.utcnow()
            review.internal_notes = "Auto-released due to inactivity (7 days)"

            # Revert application status if no other active reviews
            other_stmt = select(func.count(ApplicationReview.id)).where(
                ApplicationReview.application_id == review.application_id,
                ApplicationReview.status.in_([ReviewStatus.CLAIMED, ReviewStatus.VOTED]),
                ApplicationReview.id != review.id
            )
            other_result = await self.db.execute(other_stmt)
            if (other_result.scalar() or 0) == 0:
                app_stmt = select(ExpertApplication).where(
                    ExpertApplication.id == review.application_id
                )
                app_result = await self.db.execute(app_stmt)
                app = app_result.scalar_one_or_none()
                if app and app.status == ApplicationStatus.UNDER_REVIEW.value:
                    app.status = ApplicationStatus.SUBMITTED.value

            released_count += 1

        if released_count > 0:
            await self.db.commit()
            logger.info(f"Auto-released {released_count} stale claims")

        return released_count
