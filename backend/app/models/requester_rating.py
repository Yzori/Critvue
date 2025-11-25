"""Requester Rating database model for two-sided reputation"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.review_slot import ReviewSlot


class RequesterRating(Base):
    """
    Two-sided reputation: Reviewers rate requesters too.

    This creates accountability on both sides:
    - Requesters should provide clear requirements
    - Requesters should give fair feedback
    - Requesters should respond in reasonable time

    Visible to reviewers before claiming, helping them make informed decisions.
    """

    __tablename__ = "requester_ratings"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    review_slot_id = Column(
        Integer,
        ForeignKey("review_slots.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One rating per slot
        index=True
    )
    reviewer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )  # Who gave the rating
    requester_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )  # Who is being rated

    # Ratings (1-5 scale)
    clarity_rating = Column(Integer, nullable=False)       # Were requirements clear?
    responsiveness_rating = Column(Integer, nullable=False) # Did they respond quickly?
    fairness_rating = Column(Integer, nullable=False)      # Was their feedback fair?
    overall_rating = Column(Integer, nullable=False)       # Overall experience

    # Feedback
    feedback_text = Column(Text, nullable=True)  # Optional written feedback (private)
    is_anonymous = Column(Boolean, default=True, nullable=False)  # Show reviewer name?

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    review_slot = relationship("ReviewSlot", backref="requester_rating")
    reviewer = relationship("User", foreign_keys=[reviewer_id], backref="given_requester_ratings")
    requester = relationship("User", foreign_keys=[requester_id], backref="received_requester_ratings")

    def __repr__(self) -> str:
        return f"<RequesterRating slot={self.review_slot_id} requester={self.requester_id} overall={self.overall_rating}>"


class RequesterStats(Base):
    """
    Aggregated requester statistics for quick lookup.

    Updated whenever a new rating is submitted.
    """

    __tablename__ = "requester_stats"

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
    avg_clarity = Column(Numeric(3, 2), nullable=True)
    avg_responsiveness = Column(Numeric(3, 2), nullable=True)
    avg_fairness = Column(Numeric(3, 2), nullable=True)
    avg_overall = Column(Numeric(3, 2), nullable=True)

    # Counts
    total_ratings = Column(Integer, default=0, nullable=False)
    total_reviews_requested = Column(Integer, default=0, nullable=False)

    # Response metrics
    avg_response_hours = Column(Integer, nullable=True)  # Average time to respond to reviews
    reviews_without_feedback = Column(Integer, default=0, nullable=False)  # Left without feedback

    # Flags
    is_responsive = Column(Boolean, default=True, nullable=False)  # Responds within 48h typically
    is_fair = Column(Boolean, default=True, nullable=False)       # fairness_rating >= 4 consistently

    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="requester_stats")

    def __repr__(self) -> str:
        return f"<RequesterStats user={self.user_id} avg={self.avg_overall} ratings={self.total_ratings}>"
