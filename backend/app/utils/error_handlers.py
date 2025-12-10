"""
Error handling utilities and decorators for consistent error management.

This module provides decorators and utilities for standardized error handling
across API endpoints and services, mapping exceptions to appropriate HTTP responses.

Usage:
    from app.utils.error_handlers import handle_errors, handle_service_errors

    @router.get("/items/{item_id}")
    @handle_errors(default_message="Failed to fetch item")
    async def get_item(item_id: int):
        # Your code here - no try/catch needed
        pass
"""

import functools
import logging
from typing import Any, Callable, Dict, Optional, Type, TypeVar, Union

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.exceptions import (
    CritvueException,
    NotFoundError,
    ValidationError,
    ConflictError,
    AuthorizationError,
    AuthenticationError,
    BusinessError,
    DatabaseError,
    InternalError,
    AlreadyExistsError,
    InvalidStateError,
    ErrorCode,
)

logger = logging.getLogger(__name__)

T = TypeVar("T")


# =============================================================================
# Exception Mapping
# =============================================================================

# Map common Python exceptions to CritvueExceptions
EXCEPTION_MAP: Dict[Type[Exception], Type[CritvueException]] = {
    ValueError: BusinessError,
    PermissionError: AuthorizationError,
    RuntimeError: InternalError,
    KeyError: NotFoundError,
    TypeError: ValidationError,
}


def map_exception(exc: Exception, default_message: Optional[str] = None) -> CritvueException:
    """
    Map a generic exception to a CritvueException.

    Args:
        exc: The exception to map
        default_message: Message to use if not already set

    Returns:
        A CritvueException instance
    """
    # Already a CritvueException
    if isinstance(exc, CritvueException):
        return exc

    # Handle SQLAlchemy errors
    if isinstance(exc, IntegrityError):
        # Check for common constraint violations
        error_msg = str(exc.orig) if exc.orig else str(exc)
        if "unique constraint" in error_msg.lower() or "duplicate" in error_msg.lower():
            return AlreadyExistsError(message=default_message or "Resource already exists")
        return ConflictError(message=default_message or "Database constraint violation")

    if isinstance(exc, SQLAlchemyError):
        logger.error(f"Database error: {exc}", exc_info=True)
        return DatabaseError(message="Database operation failed")

    # Map known exception types
    exc_type = type(exc)
    if exc_type in EXCEPTION_MAP:
        critvue_exc_class = EXCEPTION_MAP[exc_type]
        message = str(exc) if str(exc) else default_message
        return critvue_exc_class(message=message)

    # Default to InternalError
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return InternalError(message=default_message or "An unexpected error occurred")


def critvue_exception_to_http(exc: CritvueException) -> HTTPException:
    """
    Convert a CritvueException to an HTTPException.

    Args:
        exc: The CritvueException to convert

    Returns:
        An HTTPException with appropriate status code and detail
    """
    return HTTPException(
        status_code=exc.status_code,
        detail=exc.to_dict(),
        headers=exc.headers
    )


# =============================================================================
# Decorators
# =============================================================================

def handle_errors(
    *,
    default_message: str = "Operation failed",
    log_errors: bool = True,
    reraise_critvue: bool = True,
    reraise_http: bool = True,
):
    """
    Decorator for consistent error handling in API endpoints.

    Catches exceptions, logs them, and converts them to appropriate HTTP responses.
    CritvueExceptions are converted to HTTPExceptions with proper status codes.

    Args:
        default_message: Default error message if exception has none
        log_errors: Whether to log caught exceptions
        reraise_critvue: Whether to re-raise CritvueExceptions as HTTPExceptions
        reraise_http: Whether to re-raise HTTPExceptions unchanged

    Usage:
        @router.get("/items/{item_id}")
        @handle_errors(default_message="Failed to fetch item")
        async def get_item(item_id: int):
            item = await service.get_item(item_id)
            if not item:
                raise NotFoundError("Item", item_id)
            return item
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> T:
            try:
                return await func(*args, **kwargs)
            except HTTPException:
                if reraise_http:
                    raise
                raise
            except CritvueException as exc:
                if log_errors:
                    logger.warning(
                        f"CritvueException in {func.__name__}: {exc.code.value} - {exc.message}"
                    )
                if reraise_critvue:
                    raise critvue_exception_to_http(exc)
                raise
            except Exception as exc:
                if log_errors:
                    logger.error(
                        f"Unhandled exception in {func.__name__}: {type(exc).__name__} - {exc}",
                        exc_info=True
                    )
                critvue_exc = map_exception(exc, default_message)
                raise critvue_exception_to_http(critvue_exc)

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> T:
            try:
                return func(*args, **kwargs)
            except HTTPException:
                if reraise_http:
                    raise
                raise
            except CritvueException as exc:
                if log_errors:
                    logger.warning(
                        f"CritvueException in {func.__name__}: {exc.code.value} - {exc.message}"
                    )
                if reraise_critvue:
                    raise critvue_exception_to_http(exc)
                raise
            except Exception as exc:
                if log_errors:
                    logger.error(
                        f"Unhandled exception in {func.__name__}: {type(exc).__name__} - {exc}",
                        exc_info=True
                    )
                critvue_exc = map_exception(exc, default_message)
                raise critvue_exception_to_http(critvue_exc)

        # Return appropriate wrapper based on whether function is async
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def handle_service_errors(
    *,
    default_message: str = "Service operation failed",
    log_errors: bool = True,
):
    """
    Decorator for consistent error handling in service layer.

    Similar to handle_errors but doesn't convert to HTTPExceptions.
    Instead, it converts exceptions to CritvueExceptions that can be
    handled by the API layer.

    Args:
        default_message: Default error message if exception has none
        log_errors: Whether to log caught exceptions

    Usage:
        class MyService:
            @handle_service_errors(default_message="Failed to process item")
            async def process_item(self, item_id: int):
                # Your code here
                pass
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> T:
            try:
                return await func(*args, **kwargs)
            except CritvueException:
                # Already a CritvueException, just re-raise
                raise
            except Exception as exc:
                if log_errors:
                    logger.error(
                        f"Service error in {func.__name__}: {type(exc).__name__} - {exc}",
                        exc_info=True
                    )
                raise map_exception(exc, default_message)

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> T:
            try:
                return func(*args, **kwargs)
            except CritvueException:
                raise
            except Exception as exc:
                if log_errors:
                    logger.error(
                        f"Service error in {func.__name__}: {type(exc).__name__} - {exc}",
                        exc_info=True
                    )
                raise map_exception(exc, default_message)

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


# =============================================================================
# Context Manager for Transaction Error Handling
# =============================================================================

class TransactionErrorHandler:
    """
    Context manager for handling errors in database transactions.

    Provides automatic rollback on error and consistent error mapping.

    Usage:
        async with TransactionErrorHandler(db, "Failed to create user") as handler:
            user = User(...)
            db.add(user)
            await db.commit()
            handler.result = user
        return handler.result
    """

    def __init__(
        self,
        db,
        default_message: str = "Transaction failed",
        log_errors: bool = True
    ):
        self.db = db
        self.default_message = default_message
        self.log_errors = log_errors
        self.result: Any = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_val is not None:
            # Rollback on any error
            await self.db.rollback()

            if self.log_errors:
                logger.error(
                    f"Transaction error: {type(exc_val).__name__} - {exc_val}",
                    exc_info=True
                )

            # Convert and re-raise as CritvueException
            if not isinstance(exc_val, CritvueException):
                critvue_exc = map_exception(exc_val, self.default_message)
                raise critvue_exc from exc_val

            # Re-raise CritvueException as-is
            return False

        return False


# =============================================================================
# Validation Helpers
# =============================================================================

def require_not_none(
    value: Optional[T],
    resource: str,
    resource_id: Optional[Any] = None
) -> T:
    """
    Require a value to be not None, raising NotFoundError if it is.

    Args:
        value: The value to check
        resource: Name of the resource (for error message)
        resource_id: Optional ID of the resource

    Returns:
        The value if not None

    Raises:
        NotFoundError: If value is None
    """
    if value is None:
        raise NotFoundError(resource=resource, resource_id=resource_id)
    return value


def require_state(
    condition: bool,
    message: str,
    current_state: Optional[str] = None,
    allowed_states: Optional[list] = None
) -> None:
    """
    Require a condition to be true, raising InvalidStateError if not.

    Args:
        condition: The condition to check
        message: Error message if condition is False
        current_state: Current state to include in error details
        allowed_states: Allowed states to include in error details

    Raises:
        InvalidStateError: If condition is False
    """
    if not condition:
        raise InvalidStateError(
            message=message,
            current_state=current_state,
            allowed_states=allowed_states
        )


def require_permission(
    condition: bool,
    message: str = "You don't have permission to perform this action"
) -> None:
    """
    Require a permission condition to be true.

    Args:
        condition: The condition to check
        message: Error message if condition is False

    Raises:
        AuthorizationError: If condition is False
    """
    if not condition:
        raise AuthorizationError(message=message)
