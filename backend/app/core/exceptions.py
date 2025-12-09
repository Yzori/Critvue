"""
Custom exception classes for Critvue API

This module provides a hierarchy of exceptions that:
- Map cleanly to HTTP status codes
- Include error codes for frontend handling
- Support structured error responses
- Enable consistent error handling across the application
"""

from enum import Enum
from typing import Any, Dict, Optional


class ErrorCode(str, Enum):
    """
    Error codes for programmatic error handling on the frontend.
    These codes allow the client to take specific actions based on error type.
    """
    # Authentication errors (401)
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"
    TOKEN_REVOKED = "TOKEN_REVOKED"

    # Authorization errors (403)
    FORBIDDEN = "FORBIDDEN"
    INACTIVE_USER = "INACTIVE_USER"
    BANNED_USER = "BANNED_USER"
    SUSPENDED_USER = "SUSPENDED_USER"
    TIER_PERMISSION_DENIED = "TIER_PERMISSION_DENIED"
    APPLICATION_REQUIRED = "APPLICATION_REQUIRED"
    NOT_OWNER = "NOT_OWNER"
    ADMIN_REQUIRED = "ADMIN_REQUIRED"

    # Resource errors (404)
    NOT_FOUND = "NOT_FOUND"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    REVIEW_NOT_FOUND = "REVIEW_NOT_FOUND"
    SLOT_NOT_FOUND = "SLOT_NOT_FOUND"

    # Validation errors (400/422)
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    MISSING_FIELD = "MISSING_FIELD"
    INVALID_FORMAT = "INVALID_FORMAT"

    # Conflict errors (409)
    CONFLICT = "CONFLICT"
    ALREADY_EXISTS = "ALREADY_EXISTS"
    DUPLICATE_ENTRY = "DUPLICATE_ENTRY"
    INVALID_STATE = "INVALID_STATE"
    ALREADY_CLAIMED = "ALREADY_CLAIMED"

    # Business logic errors (400)
    BUSINESS_ERROR = "BUSINESS_ERROR"
    INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS"
    RATE_LIMITED = "RATE_LIMITED"
    SLOT_UNAVAILABLE = "SLOT_UNAVAILABLE"
    REVIEW_LIMIT_REACHED = "REVIEW_LIMIT_REACHED"

    # Server errors (500)
    INTERNAL_ERROR = "INTERNAL_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"


class CritvueException(Exception):
    """
    Base exception for all Critvue application errors.

    Attributes:
        message: Human-readable error message
        code: Machine-readable error code for frontend handling
        status_code: HTTP status code to return
        details: Additional error details (optional)
        action: Suggested action for the client (optional)
        headers: Additional HTTP headers to include (optional)
    """

    status_code: int = 500
    default_code: ErrorCode = ErrorCode.INTERNAL_ERROR
    default_message: str = "An unexpected error occurred"

    def __init__(
        self,
        message: Optional[str] = None,
        code: Optional[ErrorCode] = None,
        details: Optional[Dict[str, Any]] = None,
        action: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        self.message = message or self.default_message
        self.code = code or self.default_code
        self.details = details
        self.action = action
        self.headers = headers
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to a dictionary for JSON response"""
        response = {
            "error": {
                "code": self.code.value,
                "message": self.message,
            }
        }
        if self.details:
            response["error"]["details"] = self.details
        if self.action:
            response["error"]["action"] = self.action
        return response


# =============================================================================
# Authentication Exceptions (401)
# =============================================================================

class AuthenticationError(CritvueException):
    """Base class for authentication errors (401)"""
    status_code = 401
    default_code = ErrorCode.NOT_AUTHENTICATED
    default_message = "Authentication required"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add WWW-Authenticate header for 401 responses
        self.headers = self.headers or {}
        self.headers["WWW-Authenticate"] = "Bearer"


class NotAuthenticatedError(AuthenticationError):
    """Raised when no authentication credentials are provided"""
    default_code = ErrorCode.NOT_AUTHENTICATED
    default_message = "Not authenticated"


class TokenExpiredError(AuthenticationError):
    """Raised when the authentication token has expired"""
    default_code = ErrorCode.TOKEN_EXPIRED
    default_message = "Authentication token has expired"


class TokenInvalidError(AuthenticationError):
    """Raised when the authentication token is invalid"""
    default_code = ErrorCode.TOKEN_INVALID
    default_message = "Could not validate credentials"


class TokenRevokedError(AuthenticationError):
    """Raised when the authentication token has been revoked"""
    default_code = ErrorCode.TOKEN_REVOKED
    default_message = "Token has been revoked"


# =============================================================================
# Authorization Exceptions (403)
# =============================================================================

class AuthorizationError(CritvueException):
    """Base class for authorization errors (403)"""
    status_code = 403
    default_code = ErrorCode.FORBIDDEN
    default_message = "You don't have permission to perform this action"


class ForbiddenError(AuthorizationError):
    """Generic forbidden error"""
    pass


class InactiveUserError(AuthorizationError):
    """Raised when an inactive user tries to access resources"""
    default_code = ErrorCode.INACTIVE_USER
    default_message = "Your account is inactive"


class BannedUserError(AuthorizationError):
    """Raised when a banned user tries to access resources"""
    default_code = ErrorCode.BANNED_USER
    default_message = "Your account has been banned"


class SuspendedUserError(AuthorizationError):
    """Raised when a suspended user tries to access resources"""
    default_code = ErrorCode.SUSPENDED_USER
    default_message = "Your account is currently suspended"

    def __init__(self, suspended_until: Optional[str] = None, *args, **kwargs):
        if suspended_until:
            kwargs["message"] = f"Your account is suspended until {suspended_until}"
            kwargs["details"] = {"suspended_until": suspended_until}
        super().__init__(*args, **kwargs)


class TierPermissionError(AuthorizationError):
    """Raised when user's tier doesn't permit the action"""
    default_code = ErrorCode.TIER_PERMISSION_DENIED
    default_message = "Your current tier doesn't allow this action"

    def __init__(self, required_tier: Optional[str] = None, *args, **kwargs):
        if required_tier:
            kwargs["details"] = kwargs.get("details", {})
            kwargs["details"]["required_tier"] = required_tier
        kwargs["action"] = kwargs.get("action", "upgrade")
        super().__init__(*args, **kwargs)


class ApplicationRequiredError(AuthorizationError):
    """Raised when user needs to apply before accessing a resource"""
    default_code = ErrorCode.APPLICATION_REQUIRED
    default_message = "You need to apply for this review first"

    def __init__(self, *args, **kwargs):
        kwargs["action"] = kwargs.get("action", "apply")
        super().__init__(*args, **kwargs)


class NotOwnerError(AuthorizationError):
    """Raised when user tries to access a resource they don't own"""
    default_code = ErrorCode.NOT_OWNER
    default_message = "You don't have permission to access this resource"


class AdminRequiredError(AuthorizationError):
    """Raised when an admin-only action is attempted by non-admin"""
    default_code = ErrorCode.ADMIN_REQUIRED
    default_message = "Administrator privileges required"


# =============================================================================
# Resource Not Found Exceptions (404)
# =============================================================================

class NotFoundError(CritvueException):
    """Base class for resource not found errors (404)"""
    status_code = 404
    default_code = ErrorCode.NOT_FOUND
    default_message = "Resource not found"

    def __init__(self, resource: Optional[str] = None, resource_id: Optional[Any] = None, *args, **kwargs):
        if resource:
            kwargs["message"] = kwargs.get("message", f"{resource} not found")
            if resource_id is not None:
                kwargs["details"] = kwargs.get("details", {})
                kwargs["details"]["resource"] = resource
                kwargs["details"]["id"] = str(resource_id)
        super().__init__(*args, **kwargs)


class UserNotFoundError(NotFoundError):
    """Raised when a user is not found"""
    default_code = ErrorCode.USER_NOT_FOUND
    default_message = "User not found"


class ReviewNotFoundError(NotFoundError):
    """Raised when a review request is not found"""
    default_code = ErrorCode.REVIEW_NOT_FOUND
    default_message = "Review request not found"


class SlotNotFoundError(NotFoundError):
    """Raised when a review slot is not found"""
    default_code = ErrorCode.SLOT_NOT_FOUND
    default_message = "Review slot not found"


# =============================================================================
# Validation Exceptions (400/422)
# =============================================================================

class ValidationError(CritvueException):
    """Base class for validation errors (422)"""
    status_code = 422
    default_code = ErrorCode.VALIDATION_ERROR
    default_message = "Validation error"

    def __init__(self, errors: Optional[Dict[str, Any]] = None, *args, **kwargs):
        if errors:
            kwargs["details"] = {"validation_errors": errors}
        super().__init__(*args, **kwargs)


class InvalidInputError(CritvueException):
    """Raised when input data is invalid (400)"""
    status_code = 400
    default_code = ErrorCode.INVALID_INPUT
    default_message = "Invalid input provided"


class MissingFieldError(ValidationError):
    """Raised when a required field is missing"""
    default_code = ErrorCode.MISSING_FIELD
    default_message = "Required field is missing"

    def __init__(self, field: str, *args, **kwargs):
        kwargs["message"] = f"Required field '{field}' is missing"
        kwargs["details"] = {"field": field}
        super().__init__(*args, **kwargs)


# =============================================================================
# Conflict Exceptions (409)
# =============================================================================

class ConflictError(CritvueException):
    """Base class for conflict errors (409)"""
    status_code = 409
    default_code = ErrorCode.CONFLICT
    default_message = "Resource conflict"


class AlreadyExistsError(ConflictError):
    """Raised when trying to create a resource that already exists"""
    default_code = ErrorCode.ALREADY_EXISTS
    default_message = "Resource already exists"

    def __init__(self, resource: Optional[str] = None, *args, **kwargs):
        if resource:
            kwargs["message"] = f"{resource} already exists"
        super().__init__(*args, **kwargs)


class InvalidStateError(ConflictError):
    """Raised when an action can't be performed due to current state"""
    default_code = ErrorCode.INVALID_STATE
    default_message = "Action cannot be performed in current state"

    def __init__(self, current_state: Optional[str] = None, allowed_states: Optional[list] = None, *args, **kwargs):
        if current_state:
            kwargs["details"] = kwargs.get("details", {})
            kwargs["details"]["current_state"] = current_state
            if allowed_states:
                kwargs["details"]["allowed_states"] = allowed_states
        super().__init__(*args, **kwargs)


class AlreadyClaimedError(ConflictError):
    """Raised when trying to claim an already claimed slot"""
    default_code = ErrorCode.ALREADY_CLAIMED
    default_message = "This review slot has already been claimed"


# =============================================================================
# Business Logic Exceptions (400)
# =============================================================================

class BusinessError(CritvueException):
    """Base class for business logic errors (400)"""
    status_code = 400
    default_code = ErrorCode.BUSINESS_ERROR
    default_message = "Business rule violation"


class InsufficientFundsError(BusinessError):
    """Raised when user doesn't have enough credits/sparks"""
    default_code = ErrorCode.INSUFFICIENT_FUNDS
    default_message = "Insufficient funds for this action"


class SlotUnavailableError(BusinessError):
    """Raised when a review slot is not available"""
    default_code = ErrorCode.SLOT_UNAVAILABLE
    default_message = "This review slot is not available"


class ReviewLimitReachedError(BusinessError):
    """Raised when user has reached their review limit"""
    default_code = ErrorCode.REVIEW_LIMIT_REACHED
    default_message = "You have reached your review limit"


# =============================================================================
# Server Exceptions (500)
# =============================================================================

class InternalError(CritvueException):
    """Base class for internal server errors (500)"""
    status_code = 500
    default_code = ErrorCode.INTERNAL_ERROR
    default_message = "An unexpected error occurred"


class DatabaseError(InternalError):
    """Raised when a database operation fails"""
    default_code = ErrorCode.DATABASE_ERROR
    default_message = "Database operation failed"


class ExternalServiceError(InternalError):
    """Raised when an external service call fails"""
    default_code = ErrorCode.EXTERNAL_SERVICE_ERROR
    default_message = "External service unavailable"

    def __init__(self, service: Optional[str] = None, *args, **kwargs):
        if service:
            kwargs["message"] = f"External service '{service}' is unavailable"
            kwargs["details"] = {"service": service}
        super().__init__(*args, **kwargs)
