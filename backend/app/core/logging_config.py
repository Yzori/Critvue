"""Logging configuration for the application"""

import logging
import sys
from typing import Any, Dict
from datetime import datetime
from fastapi import Request

# Configure logging format
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging(level: str = "INFO") -> None:
    """
    Configure application-wide logging

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format=LOG_FORMAT,
        datefmt=LOG_DATE_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Set third-party loggers to WARNING to reduce noise
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_client_info(request: Request) -> Dict[str, Any]:
    """
    Extract client information from request

    Args:
        request: FastAPI request object

    Returns:
        Dictionary with client IP, user agent, and other metadata
    """
    # Try to get real IP from X-Forwarded-For header (for proxies/load balancers)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        # Fallback to direct connection IP
        client_ip = request.client.host if request.client else "unknown"

    return {
        "ip": client_ip,
        "user_agent": request.headers.get("User-Agent", "unknown"),
        "method": request.method,
        "path": request.url.path,
        "timestamp": datetime.utcnow().isoformat()
    }


class SecurityLogger:
    """Logger for security-related events"""

    def __init__(self):
        self.logger = logging.getLogger("security")

    def log_auth_success(self, email: str, request: Request, event_type: str = "login") -> None:
        """
        Log successful authentication event

        Args:
            email: User email
            request: FastAPI request object
            event_type: Type of auth event (login, register, token_refresh)
        """
        client_info = get_client_info(request)
        self.logger.info(
            f"AUTH_SUCCESS: {event_type.upper()} | "
            f"email={email} | "
            f"ip={client_info['ip']} | "
            f"user_agent={client_info['user_agent']}"
        )

    def log_auth_failure(
        self,
        email: str,
        request: Request,
        reason: str,
        event_type: str = "login"
    ) -> None:
        """
        Log failed authentication attempt

        Args:
            email: User email (or attempted email)
            request: FastAPI request object
            reason: Reason for failure
            event_type: Type of auth event
        """
        client_info = get_client_info(request)
        self.logger.warning(
            f"AUTH_FAILURE: {event_type.upper()} | "
            f"email={email} | "
            f"reason={reason} | "
            f"ip={client_info['ip']} | "
            f"user_agent={client_info['user_agent']}"
        )

    def log_password_reset_request(self, email: str, request: Request) -> None:
        """
        Log password reset request

        Args:
            email: User email
            request: FastAPI request object
        """
        client_info = get_client_info(request)
        self.logger.info(
            f"PASSWORD_RESET_REQUEST | "
            f"email={email} | "
            f"ip={client_info['ip']} | "
            f"user_agent={client_info['user_agent']}"
        )

    def log_password_reset_success(self, email: str, request: Request) -> None:
        """
        Log successful password reset

        Args:
            email: User email
            request: FastAPI request object
        """
        client_info = get_client_info(request)
        self.logger.info(
            f"PASSWORD_RESET_SUCCESS | "
            f"email={email} | "
            f"ip={client_info['ip']} | "
            f"user_agent={client_info['user_agent']}"
        )

    def log_logout(self, email: str, request: Request) -> None:
        """
        Log user logout

        Args:
            email: User email
            request: FastAPI request object
        """
        client_info = get_client_info(request)
        self.logger.info(
            f"LOGOUT | "
            f"email={email} | "
            f"ip={client_info['ip']} | "
            f"user_agent={client_info['user_agent']}"
        )

    def log_token_blacklist(self, email: str, reason: str = "logout") -> None:
        """
        Log token blacklisting event

        Args:
            email: User email
            reason: Reason for blacklisting (logout, security, etc.)
        """
        self.logger.info(
            f"TOKEN_BLACKLIST | "
            f"email={email} | "
            f"reason={reason}"
        )

    def log_rate_limit_exceeded(self, endpoint: str, request: Request) -> None:
        """
        Log rate limit exceeded event

        Args:
            endpoint: API endpoint that was rate limited
            request: FastAPI request object
        """
        client_info = get_client_info(request)
        self.logger.warning(
            f"RATE_LIMIT_EXCEEDED | "
            f"endpoint={endpoint} | "
            f"ip={client_info['ip']} | "
            f"user_agent={client_info['user_agent']}"
        )

    def log_suspicious_activity(
        self,
        description: str,
        request: Request,
        email: str = None
    ) -> None:
        """
        Log suspicious activity

        Args:
            description: Description of suspicious activity
            request: FastAPI request object
            email: User email (if known)
        """
        client_info = get_client_info(request)
        email_part = f"email={email} | " if email else ""
        self.logger.warning(
            f"SUSPICIOUS_ACTIVITY | "
            f"{email_part}"
            f"description={description} | "
            f"ip={client_info['ip']} | "
            f"user_agent={client_info['user_agent']}"
        )


# Global security logger instance
security_logger = SecurityLogger()
