"""
Review slot-related constants.

Configuration for review claiming, submission, and lifecycle management.
"""


# =============================================================================
# Claim Timeframes (hours)
# =============================================================================

DEFAULT_CLAIM_HOURS = 72               # Default hours to complete review
MIN_CLAIM_HOURS = 24                   # Minimum claim time allowed
MAX_CLAIM_HOURS = 168                  # Maximum claim time (7 days)


# =============================================================================
# Elaboration Settings (hours)
# =============================================================================

DEFAULT_ELABORATION_RESPONSE_HOURS = 48  # Time to respond to elaboration
MAX_ELABORATION_REQUESTS = 3             # Maximum elaborations per review


# =============================================================================
# Auto-Accept Settings (days)
# =============================================================================

AUTO_ACCEPT_DAYS = 7                   # Auto-accept after 7 days
AUTO_ACCEPT_WARNING_DAYS = 5           # Send warning at 5 days


# =============================================================================
# Review Submission
# =============================================================================

# Rating bounds
MIN_RATING = 1
MAX_RATING = 5

# Content limits
MIN_REVIEW_LENGTH = 50                 # Minimum characters for review
MAX_REVIEW_LENGTH = 10000              # Maximum characters for review
MAX_ATTACHMENT_SIZE_MB = 10            # Max size per attachment
MAX_ATTACHMENTS = 5                    # Maximum attachments per review


# =============================================================================
# Slot Limits per Request
# =============================================================================

MIN_SLOTS_PER_REQUEST = 1              # Minimum reviews that can be requested
MAX_SLOTS_PER_REQUEST = 10             # Maximum reviews that can be requested


# =============================================================================
# Dispute Settings
# =============================================================================

DISPUTE_WINDOW_HOURS = 72              # Hours to file dispute after rejection
MAX_DISPUTE_REASON_LENGTH = 2000       # Max length for dispute explanation


# =============================================================================
# Content Sanitization
# =============================================================================

ALLOWED_HTML_TAGS = [
    'b', 'i', 'u', 'br', 'p', 'ul', 'ol', 'li', 'strong', 'em'
]


# =============================================================================
# Helper Functions
# =============================================================================

def validate_claim_hours(hours: int) -> int:
    """
    Validate and clamp claim hours to allowed range.

    Args:
        hours: Requested claim hours

    Returns:
        Clamped value within allowed range
    """
    return max(MIN_CLAIM_HOURS, min(hours, MAX_CLAIM_HOURS))


def is_valid_rating(rating: int) -> bool:
    """
    Check if a rating is within valid bounds.

    Args:
        rating: The rating to validate

    Returns:
        True if valid, False otherwise
    """
    return MIN_RATING <= rating <= MAX_RATING


def is_review_length_valid(content: str) -> tuple[bool, str | None]:
    """
    Validate review content length.

    Args:
        content: The review content

    Returns:
        Tuple of (is_valid, error_message)
    """
    length = len(content)

    if length < MIN_REVIEW_LENGTH:
        return False, f"Review must be at least {MIN_REVIEW_LENGTH} characters"

    if length > MAX_REVIEW_LENGTH:
        return False, f"Review cannot exceed {MAX_REVIEW_LENGTH} characters"

    return True, None
