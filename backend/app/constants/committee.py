"""
Committee review-related constants.

Configuration for the expert application review committee workflow.
"""


# =============================================================================
# Application Processing Timeframes
# =============================================================================

# Reapplication cooldown after rejection (days)
REAPPLICATION_COOLDOWN_DAYS = 90       # 3 months

# Auto-escalation after inactivity (days)
ESCALATION_DAYS = 7                    # Escalate after 7 days without review

# Maximum claim hold time (hours)
MAX_CLAIM_HOLD_HOURS = 72              # 3 days to complete review


# =============================================================================
# Voting Requirements
# =============================================================================

# Minimum votes needed for decision
MIN_VOTES_FOR_DECISION = 3

# Votes needed for immediate approval
APPROVAL_THRESHOLD = 3                 # 3 approve votes = auto-approve

# Votes needed for immediate rejection
REJECTION_THRESHOLD = 3                # 3 reject votes = auto-reject


# =============================================================================
# Committee Member Settings
# =============================================================================

# Maximum concurrent claims per member
MAX_CLAIMS_PER_MEMBER = 5

# Reviews required to maintain active status
MIN_MONTHLY_REVIEWS = 5

# Inactivity threshold (days)
INACTIVITY_THRESHOLD_DAYS = 30


# =============================================================================
# New Expert Defaults
# =============================================================================

# Default tier for approved applicants
DEFAULT_APPROVED_TIER = "expert"

# Welcome bonus for new experts
NEW_EXPERT_SPARKS_BONUS = 5000

# Probation period (days)
PROBATION_PERIOD_DAYS = 30


# =============================================================================
# Queue Management
# =============================================================================

# Default page size for queue
DEFAULT_QUEUE_PAGE_SIZE = 20

# Priority boost for escalated applications
ESCALATION_PRIORITY_BOOST = 100

# Priority boost for resubmissions
RESUBMISSION_PRIORITY_BOOST = 50


# =============================================================================
# Helper Functions
# =============================================================================

def is_decision_reached(approve_count: int, reject_count: int) -> tuple[bool, str | None]:
    """
    Check if enough votes have been cast to make a decision.

    Args:
        approve_count: Number of approval votes
        reject_count: Number of rejection votes

    Returns:
        Tuple of (decision_reached, decision) where decision is
        "approved", "rejected", or None if no decision yet
    """
    if approve_count >= APPROVAL_THRESHOLD:
        return True, "approved"
    if reject_count >= REJECTION_THRESHOLD:
        return True, "rejected"
    return False, None


def calculate_queue_priority(
    submitted_at,
    is_escalated: bool = False,
    is_resubmission: bool = False
) -> int:
    """
    Calculate queue priority score for an application.

    Higher score = higher priority (shown first).

    Args:
        submitted_at: When the application was submitted
        is_escalated: Whether the application has been escalated
        is_resubmission: Whether this is a resubmission

    Returns:
        Priority score
    """
    from datetime import datetime

    # Base priority: older applications get higher priority
    # Calculate days waiting (negative because we want older = higher)
    days_waiting = (datetime.utcnow() - submitted_at).days
    base_priority = days_waiting * 10

    # Add bonuses
    if is_escalated:
        base_priority += ESCALATION_PRIORITY_BOOST

    if is_resubmission:
        base_priority += RESUBMISSION_PRIORITY_BOOST

    return base_priority
