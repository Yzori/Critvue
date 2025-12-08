"""Reviewer Rating database model for two-sided reputation"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.review_slot import ReviewSlot


class ReviewerRating(Base):
    """
    Two-sided reputation: Requesters rate reviewers.

    This creates accountability on both sides:
    - Reviewers should provide quality feedback
    - Reviewers should be professional and constructive
    - Reviewers should be responsive to follow-up questions

    Visible on reviewer profiles, helping requesters make informed decisions.
    """

    __tablename__ = "reviewer_ratings"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    review_slot_id = Column(
        Integer,
        ForeignKey("review_slots.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One rating per slot
        index=True
    )
    requester_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )  # Who gave the rating (the person who requested the review)
    reviewer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )  # Who is being rated (the reviewer)

    # Ratings (1-5 scale)
    quality_rating = Column(Integer, nullable=False)         # Was the review thorough and helpful?
    professionalism_rating = Column(Integer, nullable=False) # Was the tone constructive?
    helpfulness_rating = Column(Integer, nullable=False)     # Did they answer follow-up questions?
    overall_rating = Column(Integer, nullable=False)         # Overall experience

    # Feedback
    feedback_text = Column(Text, nullable=True)  # Optional written feedback
    is_anonymous = Column(Boolean, default=True, nullable=False)  # Show requester name?

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    review_slot = relationship("ReviewSlot", backref="reviewer_rating")
    requester = relationship("User", foreign_keys=[requester_id], backref="given_reviewer_ratings")
    reviewer = relationship("User", foreign_keys=[reviewer_id], backref="received_reviewer_ratings")

    def __repr__(self) -> str:
        return f"<ReviewerRating slot={self.review_slot_id} reviewer={self.reviewer_id} overall={self.overall_rating}>"


class ReviewerStats(Base):
    """
    Aggregated reviewer statistics for quick lookup.

    Updated whenever a new rating is submitted.
    This supplements the existing reviewer_dna metrics with requester feedback.
    """

    __tablename__ = "reviewer_stats"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign key
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    # Aggregated ratings (stored as 2 decimal precision, e.g., 4.35)
    avg_quality = Column(Numeric(3, 2), nullable=True)
    avg_professionalism = Column(Numeric(3, 2), nullable=True)
    avg_helpfulness = Column(Numeric(3, 2), nullable=True)
    avg_overall = Column(Numeric(3, 2), nullable=True)

    # Counts
    total_ratings = Column(Integer, default=0, nullable=False)
    total_reviews_completed = Column(Integer, default=0, nullable=False)

    # Performance metrics
    avg_review_time_hours = Column(Integer, nullable=True)  # Average time from claim to submit
    reviews_accepted = Column(Integer, default=0, nullable=False)  # Reviews accepted by requesters
    reviews_rejected = Column(Integer, default=0, nullable=False)  # Reviews rejected by requesters

    # Flags (based on consistent ratings)
    is_high_quality = Column(Boolean, default=True, nullable=False)    # quality_rating >= 4 consistently
    is_professional = Column(Boolean, default=True, nullable=False)   # professionalism >= 4 consistently

    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="reviewer_stats")

    def __repr__(self) -> str:
        return f"<ReviewerStats user={self.user_id} avg={self.avg_overall} ratings={self.total_ratings}>"
