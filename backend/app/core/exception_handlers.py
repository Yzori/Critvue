"""
Global exception handlers for Critvue API

This module provides centralized exception handling that:
- Converts CritvueException to consistent JSON responses
- Handles uncaught exceptions gracefully
- Provides detailed logging for debugging
- Supports both development and production environments
"""

import logging
from typing import Union

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import CritvueException, ErrorCode
from app.core.config import settings

logger = logging.getLogger(__name__)


def create_error_response(
    code: Union[ErrorCode, str],
    message: str,
    status_code: int,
    details: dict = None,
    action: str = None,
) -> dict:
    """
    Create a standardized error response body.

    All error responses follow this structure:
    {
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message",
            "details": {...},  # optional
            "action": "suggested_action"  # optional
        }
    }
    """
    response = {
        "error": {
            "code": code.value if isinstance(code, ErrorCode) else code,
            "message": message,
        }
    }
    if details:
        response["error"]["details"] = details
    if action:
        response["error"]["action"] = action
    return response


async def critvue_exception_handler(
    request: Request,
    exc: CritvueException
) -> JSONResponse:
    """
    Handler for all CritvueException subclasses.

    Converts our custom exceptions into consistent JSON responses.
    """
    # Log the exception
    log_exception(request, exc, exc.status_code)

    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
        headers=exc.headers,
    )


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
) -> JSONResponse:
    """
    Handler for standard HTTP exceptions (from FastAPI/Starlette).

    Converts HTTPException to our standard error format for consistency.
    This handles HTTPException raised by FastAPI dependencies or middleware.
    """
    # Log the exception
    log_exception(request, exc, exc.status_code)

    # Handle structured detail (dict) vs string detail
    if isinstance(exc.detail, dict):
        # Already structured, preserve it but wrap in our format
        code = exc.detail.get("code", get_default_error_code(exc.status_code))
        message = exc.detail.get("message", str(exc.detail))
        details = {k: v for k, v in exc.detail.items() if k not in ("code", "message", "action")}
        action = exc.detail.get("action")
    else:
        # String detail, convert to our format
        code = get_default_error_code(exc.status_code)
        message = str(exc.detail) if exc.detail else get_default_message(exc.status_code)
        details = None
        action = None

    response = create_error_response(
        code=code,
        message=message,
        status_code=exc.status_code,
        details=details if details else None,
        action=action,
    )

    headers = getattr(exc, "headers", None)
    return JSONResponse(
        status_code=exc.status_code,
        content=response,
        headers=headers,
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """
    Handler for Pydantic validation errors.

    Converts validation errors to our standard format with detailed field information.
    """
    # Log the exception
    log_exception(request, exc, 422)

    # Format validation errors for frontend
    errors = []
    for error in exc.errors():
        field_path = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append({
            "field": field_path,
            "message": error["msg"],
            "type": error["type"],
        })

    response = create_error_response(
        code=ErrorCode.VALIDATION_ERROR,
        message="Request validation failed",
        status_code=422,
        details={"validation_errors": errors},
    )

    return JSONResponse(
        status_code=422,
        content=response,
    )


async def unhandled_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """
    Handler for all uncaught exceptions.

    This is the last line of defense - catches anything not handled elsewhere.
    In production, returns a generic error. In development, includes more details.
    """
    # Always log unhandled exceptions with full traceback
    logger.exception(
        f"Unhandled exception on {request.method} {request.url.path}",
        exc_info=exc,
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "user_id": getattr(request.state, "user_id", None),
        }
    )

    # In development, include exception details
    if not settings.is_production:
        response = create_error_response(
            code=ErrorCode.INTERNAL_ERROR,
            message=str(exc),
            status_code=500,
            details={
                "exception_type": type(exc).__name__,
                "path": request.url.path,
                "method": request.method,
            },
        )
    else:
        # In production, hide implementation details
        response = create_error_response(
            code=ErrorCode.INTERNAL_ERROR,
            message="An unexpected error occurred. Please try again later.",
            status_code=500,
        )

    return JSONResponse(
        status_code=500,
        content=response,
    )


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register all exception handlers with the FastAPI application.

    Call this in main.py after creating the FastAPI app:
        from app.core.exception_handlers import register_exception_handlers
        register_exception_handlers(app)
    """
    # Our custom exceptions
    app.add_exception_handler(CritvueException, critvue_exception_handler)

    # Standard HTTP exceptions (from FastAPI/Starlette)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)

    # Pydantic validation errors
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    # Catch-all for unhandled exceptions
    app.add_exception_handler(Exception, unhandled_exception_handler)


def log_exception(request: Request, exc: Exception, status_code: int) -> None:
    """
    Log an exception with appropriate level based on status code.

    - 4xx errors: logged as warnings (client errors)
    - 5xx errors: logged as errors (server errors)
    """
    log_data = {
        "path": request.url.path,
        "method": request.method,
        "status_code": status_code,
        "error_type": type(exc).__name__,
        "request_id": getattr(request.state, "request_id", None),
    }

    message = f"{request.method} {request.url.path} -> {status_code}: {exc}"

    if status_code >= 500:
        logger.error(message, extra=log_data, exc_info=True)
    elif status_code >= 400:
        logger.warning(message, extra=log_data)
    else:
        logger.info(message, extra=log_data)


def get_default_error_code(status_code: int) -> str:
    """Get a default error code based on HTTP status code."""
    mapping = {
        400: ErrorCode.INVALID_INPUT.value,
        401: ErrorCode.NOT_AUTHENTICATED.value,
        403: ErrorCode.FORBIDDEN.value,
        404: ErrorCode.NOT_FOUND.value,
        409: ErrorCode.CONFLICT.value,
        422: ErrorCode.VALIDATION_ERROR.value,
        429: ErrorCode.RATE_LIMITED.value,
        500: ErrorCode.INTERNAL_ERROR.value,
    }
    return mapping.get(status_code, ErrorCode.INTERNAL_ERROR.value)


def get_default_message(status_code: int) -> str:
    """Get a default error message based on HTTP status code."""
    mapping = {
        400: "Bad request",
        401: "Authentication required",
        403: "Permission denied",
        404: "Resource not found",
        409: "Resource conflict",
        422: "Validation error",
        429: "Too many requests",
        500: "Internal server error",
    }
    return mapping.get(status_code, "An error occurred")
