"""Review Slot schemas package

This package contains all Pydantic schemas for review slot operations,
organized into focused modules:

- enums: Expert review enums (PrincipleCategory, ImpactType, etc.)
- feedback: Structured feedback schemas (ratings, improvements, strengths)
- base: Base schemas (ReviewSlotBase, ReviewSlotCreate)
- submission: Review submission schemas (FeedbackSection, Annotation, DraftSave)
- smart_review: Smart Adaptive Review Editor schemas (Phase1, Phase2, Phase3)
- actions: Review action schemas (accept, reject, elaborate, dispute)
- responses: Response schemas (ReviewSlotResponse, ReviewSlotPublicResponse)
- dashboard: Reviewer dashboard schemas
- admin: Admin schemas (DisputedReview)
"""

# Enums
from .enums import (
    PrincipleCategory,
    ImpactType,
    EffortEstimate,
    ConfidenceLevel,
    ImprovementCategory,
)

# Feedback schemas
from .feedback import (
    RatingRationale,
    RatingRationaleDraft,
    ResourceLink,
    StructuredImprovement,
    StructuredImprovementDraft,
    StructuredStrength,
    StructuredStrengthDraft,
    TopTakeaway,
    TopTakeawayDraft,
    ExecutiveSummary,
    ExecutiveSummaryDraft,
    FollowUpOffer,
    FollowUpOfferDraft,
)

# Base schemas
from .base import (
    ReviewSlotBase,
    ReviewSlotCreate,
)

# Submission schemas
from .submission import (
    FeedbackSection,
    Annotation,
    DraftSave,
    DraftResponse,
    DraftSaveSuccess,
    ReviewSubmit,
)

# Smart review schemas
from .smart_review import (
    Phase1QuickAssessment,
    Phase1QuickAssessmentDraft,
    Phase2RubricRatings,
    Phase2RubricRatingsDraft,
    VisualAnnotation,
    Phase3DetailedFeedback,
    Phase3DetailedFeedbackDraft,
    QualityMetrics,
    SmartReviewMetadata,
    SmartReviewDraft,
    SmartReviewSubmit,
)

# Action schemas
from .actions import (
    ReviewAccept,
    ReviewReject,
    RequestElaboration,
    ReviewDispute,
    DisputeResolve,
)

# Response schemas
from .responses import (
    ReviewerInfo,
    ReviewSlotResponse,
    ReviewSlotPublicResponse,
    ReviewSlotListResponse,
    ReviewSlotStats,
)

# Dashboard schemas
from .dashboard import (
    ReviewerSlotWithRequest,
    ReviewerSlotListResponse,
    ReviewerDashboard,
    ReviewerEarnings,
)

# Admin schemas
from .admin import (
    DisputedReview,
    DisputeListResponse,
)

__all__ = [
    # Enums
    "PrincipleCategory",
    "ImpactType",
    "EffortEstimate",
    "ConfidenceLevel",
    "ImprovementCategory",
    # Feedback
    "RatingRationale",
    "RatingRationaleDraft",
    "ResourceLink",
    "StructuredImprovement",
    "StructuredImprovementDraft",
    "StructuredStrength",
    "StructuredStrengthDraft",
    "TopTakeaway",
    "TopTakeawayDraft",
    "ExecutiveSummary",
    "ExecutiveSummaryDraft",
    "FollowUpOffer",
    "FollowUpOfferDraft",
    # Base
    "ReviewSlotBase",
    "ReviewSlotCreate",
    # Submission
    "FeedbackSection",
    "Annotation",
    "DraftSave",
    "DraftResponse",
    "DraftSaveSuccess",
    "ReviewSubmit",
    # Smart Review
    "Phase1QuickAssessment",
    "Phase1QuickAssessmentDraft",
    "Phase2RubricRatings",
    "Phase2RubricRatingsDraft",
    "VisualAnnotation",
    "Phase3DetailedFeedback",
    "Phase3DetailedFeedbackDraft",
    "QualityMetrics",
    "SmartReviewMetadata",
    "SmartReviewDraft",
    "SmartReviewSubmit",
    # Actions
    "ReviewAccept",
    "ReviewReject",
    "RequestElaboration",
    "ReviewDispute",
    "DisputeResolve",
    # Responses
    "ReviewerInfo",
    "ReviewSlotResponse",
    "ReviewSlotPublicResponse",
    "ReviewSlotListResponse",
    "ReviewSlotStats",
    # Dashboard
    "ReviewerSlotWithRequest",
    "ReviewerSlotListResponse",
    "ReviewerDashboard",
    "ReviewerEarnings",
    # Admin
    "DisputedReview",
    "DisputeListResponse",
]
