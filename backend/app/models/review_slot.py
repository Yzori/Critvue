"""Review Slot database model for tracking individual review slots"""

import enum
from datetime import datetime, timedelta
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    CheckConstraint
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.review_request import ReviewRequest


class ReviewSlotStatus(str, enum.Enum):
    """Status of an individual review slot"""
    AVAILABLE = "available"      # Not yet claimed
    CLAIMED = "claimed"          # Claimed by reviewer, work in progress
    SUBMITTED = "submitted"      # Review submitted, awaiting acceptance
    ACCEPTED = "accepted"        # Accepted by requester (final state)
    REJECTED = "rejected"        # Rejected by requester (refund issued)
    ABANDONED = "abandoned"      # Reviewer abandoned or timed out
    DISPUTED = "disputed"        # Rejection disputed, awaiting admin decision
    ELABORATION_REQUESTED = "elaboration_requested"  # Creator wants more detail


class AcceptanceType(str, enum.Enum):
    """How a review was accepted"""
    MANUAL = "manual"           # Requester manually accepted
    AUTO = "auto"               # Auto-accepted after 7 days


class RejectionReason(str, enum.Enum):
    """Reasons for rejecting a review"""
    LOW_QUALITY = "low_quality"  # Too short, unhelpful, generic
    OFF_TOPIC = "off_topic"      # Doesn't address the request
    SPAM = "spam"                # Automated or copy-paste content
    ABUSIVE = "abusive"          # Inappropriate language
    OTHER = "other"              # Must provide explanation


class PaymentStatus(str, enum.Enum):
    """Payment status for expert reviews"""
    PENDING = "pending"          # No payment yet
    ESCROWED = "escrowed"        # Funds held in escrow
    RELEASED = "released"        # Payment released to reviewer
    REFUNDED = "refunded"        # Refunded to requester


class DisputeResolution(str, enum.Enum):
    """Admin resolution for disputed reviews"""
    ADMIN_ACCEPTED = "admin_accepted"  # Admin sided with reviewer
    ADMIN_REJECTED = "admin_rejected"  # Admin sided with requester


class ReviewSlot(Base):
    """Individual review slot within a review request"""

    __tablename__ = "review_slots"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    review_request_id = Column(
        Integer,
        ForeignKey("review_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    reviewer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # State management (use String for SQLite compatibility)
    status = Column(
        String(20),
        nullable=False,
        default=ReviewSlotStatus.AVAILABLE.value,
        index=True
    )

    # Lifecycle timestamps
    claimed_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)  # When requester accepted/rejected
    claim_deadline = Column(DateTime, nullable=True, index=True)  # claimed_at + 72h
    auto_accept_at = Column(DateTime, nullable=True, index=True)  # submitted_at + 7 days

    # Review content (denormalized for simplicity)
    review_text = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 stars
    review_attachments = Column(Text, nullable=True)  # JSON stored as Text for SQLite

    # Structured feedback (new format - Phase 1 of Smart Adaptive Review Editor)
    feedback_sections = Column(JSON, nullable=True)  # Structured section-based feedback
    annotations = Column(JSON, nullable=True)        # Context-specific annotations (pins, timestamps, etc.)
    draft_sections = Column(JSON, nullable=True)     # Auto-saved section drafts

    # Acceptance/Rejection metadata (use String for SQLite compatibility)
    acceptance_type = Column(String(20), nullable=True)
    rejection_reason = Column(String(20), nullable=True)
    rejection_notes = Column(Text, nullable=True)

    # Dispute handling
    is_disputed = Column(Boolean, default=False, nullable=False)
    dispute_reason = Column(Text, nullable=True)
    dispute_resolved_at = Column(DateTime, nullable=True)
    dispute_resolution = Column(String(20), nullable=True)  # Use String for SQLite
    dispute_notes = Column(Text, nullable=True)  # Admin notes

    # Elaboration request tracking
    elaboration_request = Column(Text, nullable=True)  # What creator wants elaborated
    elaboration_requested_at = Column(DateTime, nullable=True)
    elaboration_count = Column(Integer, default=0, nullable=False)  # Track request count
    elaboration_deadline = Column(DateTime, nullable=True, index=True)  # When reviewer needs to respond

    # Payment tracking (for expert reviews)
    payment_amount = Column(Numeric(10, 2), nullable=True)  # Amount reviewer receives (before platform fee)
    payment_status = Column(
        String(20),
        nullable=False,
        default=PaymentStatus.PENDING.value,
        index=True
    )
    payment_released_at = Column(DateTime, nullable=True)
    transaction_id = Column(String(100), nullable=True)  # External payment processor ID

    # Stripe transfer tracking (for Connect payouts)
    stripe_transfer_id = Column(String(255), nullable=True, index=True)  # Transfer to reviewer's Connect account
    platform_fee_amount = Column(Numeric(10, 2), nullable=True)  # 20% platform fee
    net_amount_to_reviewer = Column(Numeric(10, 2), nullable=True)  # Amount after platform fee

    # Quality metrics
    requester_helpful_rating = Column(Integer, nullable=True)  # 1-5: How helpful was this?

    # NDA tracking (for requests that require NDA)
    nda_signed_at = Column(DateTime, nullable=True)  # When reviewer signed NDA for this slot

    # Audit trail
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Constraints
    __table_args__ = (
        # Rating must be 1-5
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        CheckConstraint(
            'requester_helpful_rating >= 1 AND requester_helpful_rating <= 5',
            name='check_helpful_rating_range'
        ),
        # Composite indexes for performance
        Index('idx_slot_status_deadline', 'status', 'claim_deadline'),  # Timeout processing
        Index('idx_slot_status_auto_accept', 'status', 'auto_accept_at'),  # Auto-accept processing
        Index('idx_slot_reviewer_status', 'reviewer_id', 'status'),  # Reviewer dashboard
        Index('idx_slot_request_status', 'review_request_id', 'status'),  # Request detail page
    )

    # Relationships
    review_request = relationship("ReviewRequest", back_populates="slots")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

    def __repr__(self) -> str:
        return f"<ReviewSlot {self.id}: {self.status}>"

    # ===== Helper Methods =====

    def _get_status_enum(self) -> ReviewSlotStatus:
        """Convert string status to enum"""
        return ReviewSlotStatus(self.status)

    def _set_status(self, status: ReviewSlotStatus) -> None:
        """Set status from enum"""
        self.status = status.value

    # ===== Properties =====

    @property
    def is_claimable(self) -> bool:
        """Check if slot can be claimed"""
        return self.status == ReviewSlotStatus.AVAILABLE.value

    @property
    def is_submittable(self) -> bool:
        """Check if review can be submitted"""
        return (
            self.status == ReviewSlotStatus.CLAIMED.value and
            self.claim_deadline is not None and
            datetime.utcnow() < self.claim_deadline
        )

    @property
    def is_reviewable(self) -> bool:
        """Check if requester can accept/reject"""
        return (
            self.status == ReviewSlotStatus.SUBMITTED.value and
            self.auto_accept_at is not None and
            datetime.utcnow() < self.auto_accept_at
        )

    @property
    def is_disputable(self) -> bool:
        """Check if reviewer can dispute rejection"""
        if self.status != ReviewSlotStatus.REJECTED.value or self.is_disputed:
            return False
        if self.reviewed_at is None:
            return False
        # Can dispute within 7 days of rejection
        dispute_deadline = self.reviewed_at + timedelta(days=7)
        return datetime.utcnow() < dispute_deadline

    @property
    def is_final(self) -> bool:
        """Check if slot is in a final state"""
        return self.status in [
            ReviewSlotStatus.ACCEPTED.value,
            ReviewSlotStatus.ABANDONED.value
        ]

    @property
    def time_until_deadline(self) -> Optional[timedelta]:
        """Get time remaining until claim deadline"""
        if self.claim_deadline is None:
            return None
        remaining = self.claim_deadline - datetime.utcnow()
        return remaining if remaining.total_seconds() > 0 else timedelta(0)

    @property
    def time_until_auto_accept(self) -> Optional[timedelta]:
        """Get time remaining until auto-accept"""
        if self.auto_accept_at is None:
            return None
        remaining = self.auto_accept_at - datetime.utcnow()
        return remaining if remaining.total_seconds() > 0 else timedelta(0)

    @property
    def is_past_deadline(self) -> bool:
        """Check if claim deadline has passed"""
        if self.claim_deadline is None:
            return False
        return datetime.utcnow() >= self.claim_deadline

    @property
    def should_auto_accept(self) -> bool:
        """Check if review should be auto-accepted"""
        if self.status != ReviewSlotStatus.SUBMITTED.value:
            return False
        if self.auto_accept_at is None:
            return False
        return datetime.utcnow() >= self.auto_accept_at

    @property
    def review_preview(self) -> Optional[str]:
        """Get first 100 characters of review text"""
        if not self.review_text:
            return None
        return self.review_text[:100] + ("..." if len(self.review_text) > 100 else "")

    @property
    def requires_payment(self) -> bool:
        """Check if this is a paid review slot"""
        return self.payment_amount is not None and self.payment_amount > 0

    @property
    def is_elaboration_requestable(self) -> bool:
        """Check if creator can request elaboration on this review"""
        # Can only request elaboration on submitted reviews (max 2 times)
        return (
            self.status == ReviewSlotStatus.SUBMITTED.value and
            self.elaboration_count < 2
        )

    @property
    def is_elaboration_respondable(self) -> bool:
        """Check if reviewer can respond to elaboration request"""
        return (
            self.status == ReviewSlotStatus.ELABORATION_REQUESTED.value and
            self.elaboration_deadline is not None and
            datetime.utcnow() < self.elaboration_deadline
        )

    # ===== State Transition Methods =====

    def claim(self, reviewer_id: int, claim_hours: int = 72) -> None:
        """
        Claim this slot for a reviewer

        Args:
            reviewer_id: ID of the reviewer claiming
            claim_hours: Hours until deadline (default 72)

        Raises:
            ValueError: If slot is not claimable
        """
        if not self.is_claimable:
            raise ValueError(f"Slot cannot be claimed in status '{self.status}'")

        now = datetime.utcnow()
        self.reviewer_id = reviewer_id
        self.status = ReviewSlotStatus.CLAIMED.value
        self.claimed_at = now
        self.claim_deadline = now + timedelta(hours=claim_hours)
        self.updated_at = now

    def unclaim(self) -> None:
        """
        Unclaim this slot (reviewer voluntarily gives up)

        Raises:
            ValueError: If slot cannot be unclaimed
        """
        if self.status != ReviewSlotStatus.CLAIMED.value:
            raise ValueError(f"Can only unclaim CLAIMED slots, not '{self.status}'")

        self.reviewer_id = None
        self.status = ReviewSlotStatus.AVAILABLE.value
        self.claimed_at = None
        self.claim_deadline = None
        self.updated_at = datetime.utcnow()

    def submit_review(
        self,
        review_text: str,
        rating: int,
        attachments: Optional[list] = None,
        auto_accept_days: int = 7
    ) -> None:
        """
        Submit review for this slot

        Args:
            review_text: Review content
            rating: Rating 1-5
            attachments: Optional list of attachment metadata
            auto_accept_days: Days until auto-accept (default 7)

        Raises:
            ValueError: If slot is not submittable or content invalid
        """
        if not self.is_submittable:
            raise ValueError(f"Slot cannot accept submission in status '{self.status}'")

        if not review_text or len(review_text.strip()) < 50:
            raise ValueError("Review text must be at least 50 characters")

        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")

        now = datetime.utcnow()
        self.review_text = review_text.strip()
        self.rating = rating
        # Store attachments as JSON string for SQLite
        import json
        self.review_attachments = json.dumps(attachments) if attachments else None
        self.status = ReviewSlotStatus.SUBMITTED.value
        self.submitted_at = now
        self.auto_accept_at = now + timedelta(days=auto_accept_days)
        self.updated_at = now

    def accept(self, is_auto: bool = False, helpful_rating: Optional[int] = None) -> None:
        """
        Accept this review

        Args:
            is_auto: Whether this is auto-acceptance
            helpful_rating: Optional 1-5 rating of helpfulness

        Raises:
            ValueError: If slot cannot be accepted
        """
        if self.status != ReviewSlotStatus.SUBMITTED.value:
            raise ValueError(f"Can only accept SUBMITTED reviews, not '{self.status}'")

        now = datetime.utcnow()
        self.status = ReviewSlotStatus.ACCEPTED.value
        self.acceptance_type = AcceptanceType.AUTO.value if is_auto else AcceptanceType.MANUAL.value
        self.reviewed_at = now
        self.requester_helpful_rating = helpful_rating
        self.updated_at = now

        # Release payment for expert reviews
        if self.requires_payment and self.payment_status == PaymentStatus.ESCROWED.value:
            self.payment_status = PaymentStatus.RELEASED.value
            self.payment_released_at = now

    def reject(self, reason: RejectionReason, notes: Optional[str] = None) -> None:
        """
        Reject this review

        Args:
            reason: Rejection reason enum
            notes: Optional detailed explanation

        Raises:
            ValueError: If slot cannot be rejected or invalid reason
        """
        if self.status != ReviewSlotStatus.SUBMITTED.value:
            raise ValueError(f"Can only reject SUBMITTED reviews, not '{self.status}'")

        if reason == RejectionReason.OTHER and not notes:
            raise ValueError("Must provide notes when rejection reason is 'other'")

        now = datetime.utcnow()
        self.status = ReviewSlotStatus.REJECTED.value
        self.rejection_reason = reason.value
        self.rejection_notes = notes
        self.reviewed_at = now
        self.updated_at = now

        # Refund payment for expert reviews
        if self.requires_payment and self.payment_status == PaymentStatus.ESCROWED.value:
            self.payment_status = PaymentStatus.REFUNDED.value

    def abandon(self) -> None:
        """
        Mark slot as abandoned (timeout or manual)

        Raises:
            ValueError: If slot cannot be abandoned
        """
        if self.status != ReviewSlotStatus.CLAIMED.value:
            raise ValueError(f"Can only abandon CLAIMED slots, not '{self.status}'")

        self.status = ReviewSlotStatus.ABANDONED.value
        self.updated_at = datetime.utcnow()

    def dispute(self, reason: str) -> None:
        """
        Dispute a rejection

        Args:
            reason: Explanation for dispute

        Raises:
            ValueError: If slot cannot be disputed
        """
        if not self.is_disputable:
            raise ValueError("This rejection cannot be disputed")

        if not reason or len(reason.strip()) < 20:
            raise ValueError("Dispute reason must be at least 20 characters")

        self.is_disputed = True
        self.status = ReviewSlotStatus.DISPUTED.value
        self.dispute_reason = reason.strip()
        self.updated_at = datetime.utcnow()

    def resolve_dispute(
        self,
        resolution: DisputeResolution,
        admin_notes: Optional[str] = None
    ) -> None:
        """
        Admin resolves a dispute

        Args:
            resolution: Admin decision
            admin_notes: Optional admin explanation

        Raises:
            ValueError: If slot is not disputed
        """
        if self.status != ReviewSlotStatus.DISPUTED.value:
            raise ValueError(f"Can only resolve DISPUTED slots, not '{self.status}'")

        now = datetime.utcnow()
        self.dispute_resolution = resolution.value
        self.dispute_notes = admin_notes
        self.dispute_resolved_at = now
        self.updated_at = now

        # Update status based on resolution
        if resolution == DisputeResolution.ADMIN_ACCEPTED:
            # Overturn rejection: Accept the review
            self.status = ReviewSlotStatus.ACCEPTED.value
            self.acceptance_type = AcceptanceType.MANUAL.value  # Admin action counts as manual

            # Release payment if it was refunded
            if self.requires_payment and self.payment_status == PaymentStatus.REFUNDED.value:
                self.payment_status = PaymentStatus.RELEASED.value
                self.payment_released_at = now
        else:
            # Uphold rejection
            self.status = ReviewSlotStatus.REJECTED.value

    def request_elaboration(
        self,
        request_text: str,
        response_hours: int = 48
    ) -> None:
        """
        Creator requests elaboration on specific areas of the review

        Args:
            request_text: What the creator wants elaborated
            response_hours: Hours for reviewer to respond (default 48)

        Raises:
            ValueError: If slot cannot have elaboration requested
        """
        if not self.is_elaboration_requestable:
            if self.elaboration_count >= 2:
                raise ValueError("Maximum elaboration requests (2) reached")
            raise ValueError(f"Cannot request elaboration in status '{self.status}'")

        if not request_text or len(request_text.strip()) < 20:
            raise ValueError("Elaboration request must be at least 20 characters")

        now = datetime.utcnow()
        self.elaboration_request = request_text.strip()
        self.elaboration_requested_at = now
        self.elaboration_count += 1
        self.elaboration_deadline = now + timedelta(hours=response_hours)
        self.status = ReviewSlotStatus.ELABORATION_REQUESTED.value
        self.updated_at = now

    def respond_to_elaboration(self) -> None:
        """
        Reviewer responds to elaboration request (resubmits review)
        The actual content update happens through submit_smart_review endpoint

        Raises:
            ValueError: If slot is not in elaboration requested state
        """
        if self.status != ReviewSlotStatus.ELABORATION_REQUESTED.value:
            raise ValueError(f"Can only respond to ELABORATION_REQUESTED slots, not '{self.status}'")

        now = datetime.utcnow()
        self.status = ReviewSlotStatus.SUBMITTED.value
        self.submitted_at = now  # Update submission time
        self.auto_accept_at = now + timedelta(days=7)  # Reset auto-accept
        self.elaboration_request = None  # Clear the request
        self.elaboration_deadline = None
        self.updated_at = now
