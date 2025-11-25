"""
Reviewer DNA Model

Stores the calculated "DNA fingerprint" for each reviewer,
representing their unique review style across 6 dimensions.
"""

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.user import Base


class ReviewerDNA(Base):
    """
    Reviewer DNA - A unique fingerprint of a reviewer's style.

    Dimensions (0-100 scale):
    - speed: How quickly they complete reviews (response time percentile)
    - depth: Thoroughness of feedback (word count, structure)
    - specificity: Actionable suggestions per review
    - constructiveness: Balance of positive/constructive feedback
    - technical: Domain expertise accuracy
    - encouragement: Supportive language score
    """
    __tablename__ = "reviewer_dna"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # DNA Dimensions (0-100 scale)
    speed = Column(Float, default=50.0, nullable=False)
    depth = Column(Float, default=50.0, nullable=False)
    specificity = Column(Float, default=50.0, nullable=False)
    constructiveness = Column(Float, default=50.0, nullable=False)
    technical = Column(Float, default=50.0, nullable=False)
    encouragement = Column(Float, default=50.0, nullable=False)

    # Overall score (weighted average)
    overall_score = Column(Float, default=50.0, nullable=False)

    # Metadata
    version = Column(Integer, default=1, nullable=False)
    reviews_analyzed = Column(Integer, default=0, nullable=False)

    # Timestamps
    calculated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship
    user = relationship("User", back_populates="reviewer_dna")

    # Indexes for efficient queries
    __table_args__ = (
        Index('idx_reviewer_dna_overall', 'overall_score'),
        Index('idx_reviewer_dna_calculated', 'calculated_at'),
    )

    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            "user_id": self.user_id,
            "speed": round(self.speed, 1),
            "depth": round(self.depth, 1),
            "specificity": round(self.specificity, 1),
            "constructiveness": round(self.constructiveness, 1),
            "technical": round(self.technical, 1),
            "encouragement": round(self.encouragement, 1),
            "overall_score": round(self.overall_score, 1),
            "reviews_analyzed": self.reviews_analyzed,
            "version": self.version,
            "calculated_at": self.calculated_at.isoformat() if self.calculated_at else None,
        }

    def calculate_overall(self):
        """Calculate overall score as weighted average."""
        # Weight distribution (can be tuned)
        weights = {
            "speed": 0.15,
            "depth": 0.20,
            "specificity": 0.20,
            "constructiveness": 0.20,
            "technical": 0.15,
            "encouragement": 0.10,
        }

        self.overall_score = (
            self.speed * weights["speed"] +
            self.depth * weights["depth"] +
            self.specificity * weights["specificity"] +
            self.constructiveness * weights["constructiveness"] +
            self.technical * weights["technical"] +
            self.encouragement * weights["encouragement"]
        )
        return self.overall_score
