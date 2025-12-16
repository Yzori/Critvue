"""Email service using Resend

This module provides email sending capabilities for both development and production.

Development: Logs emails to console and saves to dev_emails/ folder
Production: Sends via Resend API (https://resend.com)

Setup:
1. Create account at https://resend.com
2. Add and verify your domain
3. Get API key from dashboard
4. Set EMAIL_API_KEY in .env
"""

import asyncio
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger(__name__)

# Retry configuration
MAX_RETRIES = 3
INITIAL_RETRY_DELAY = 1.0  # seconds
MAX_RETRY_DELAY = 30.0  # seconds

# Template directory
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


class EmailService:
    """
    Email service with Resend integration and Jinja2 templating.

    Usage:
        email_service = EmailService()
        await email_service.send_email(
            to_email="user@example.com",
            subject="Hello",
            html_content="<h1>Hi there!</h1>"
        )

        # Or with templates:
        await email_service.send_templated_email(
            to_email="user@example.com",
            subject="Welcome!",
            template_name="welcome.html",
            context={"user_name": "John"}
        )
    """

    def __init__(self):
        """Initialize email service based on environment"""
        self.environment = settings.ENVIRONMENT
        self.email_from = settings.EMAIL_FROM
        self.reply_to = settings.EMAIL_REPLY_TO or None
        self.frontend_url = settings.FRONTEND_URL

        # Development email storage
        self.dev_email_dir = Path("dev_emails")
        if not settings.is_production:
            self.dev_email_dir.mkdir(exist_ok=True)

        # Initialize Jinja2 template environment
        self._jinja_env = Environment(
            loader=FileSystemLoader(TEMPLATES_DIR),
            autoescape=select_autoescape(['html', 'xml']),
            trim_blocks=True,
            lstrip_blocks=True,
        )

        # Initialize Resend in production
        self._resend_configured = False
        if settings.is_production and settings.EMAIL_API_KEY:
            try:
                import resend
                resend.api_key = settings.EMAIL_API_KEY
                self._resend_configured = True
                logger.info("Resend email service configured successfully")
            except ImportError:
                logger.error("Resend package not installed. Run: pip install resend")
            except Exception as e:
                logger.error(f"Failed to configure Resend: {e}")

    def render_template(
        self,
        template_name: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Render a Jinja2 email template.

        Args:
            template_name: Name of the template file (e.g., "welcome.html")
            context: Dictionary of variables to pass to the template

        Returns:
            Rendered HTML string
        """
        template = self._jinja_env.get_template(f"email/{template_name}")

        # Build base context
        base_context = {
            "frontend_url": self.frontend_url,
            "current_year": datetime.now(timezone.utc).year,
        }

        # Merge with provided context
        if context:
            base_context.update(context)

        return template.render(**base_context)

    async def send_templated_email(
        self,
        to_email: str,
        subject: str,
        template_name: str,
        context: Optional[Dict[str, Any]] = None,
        text_content: Optional[str] = None,
        reply_to: Optional[str] = None,
        tags: Optional[List[dict]] = None,
        unsubscribe_url: Optional[str] = None,
    ) -> bool:
        """
        Send an email using a Jinja2 template.

        Args:
            to_email: Recipient email address
            subject: Email subject
            template_name: Name of the template file
            context: Dictionary of variables to pass to the template
            text_content: Plain text fallback
            reply_to: Reply-to address
            tags: List of tags for tracking
            unsubscribe_url: Optional unsubscribe URL for email compliance

        Returns:
            True if email was sent successfully
        """
        try:
            # Add unsubscribe URL to context if provided
            if context is None:
                context = {}
            if unsubscribe_url:
                context["unsubscribe_url"] = unsubscribe_url

            html_content = self.render_template(template_name, context)
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                reply_to=reply_to,
                tags=tags,
            )
        except Exception as e:
            logger.error(f"Failed to render template {template_name}: {e}")
            return False

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        reply_to: Optional[str] = None,
        tags: Optional[List[dict]] = None,
    ) -> bool:
        """
        Send an email

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML body of email
            text_content: Plain text body (fallback)
            reply_to: Reply-to address (overrides default)
            tags: List of tags for tracking (e.g., [{"name": "category", "value": "password_reset"}])

        Returns:
            True if email was sent successfully
        """
        if settings.is_production:
            return await self._send_email_production(
                to_email, subject, html_content, text_content, reply_to, tags
            )
        else:
            return await self._send_email_dev(
                to_email, subject, html_content, text_content
            )

    async def _send_email_dev(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Development email sender - logs to console and saves to file
        """
        logger.info("=" * 80)
        logger.info("DEVELOPMENT EMAIL")
        logger.info("=" * 80)
        logger.info(f"From: {self.email_from}")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info("-" * 80)
        logger.info("HTML Content:")
        logger.info(html_content)
        if text_content:
            logger.info("-" * 80)
            logger.info("Text Content:")
            logger.info(text_content)
        logger.info("=" * 80)

        # Save to file with timestamp
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        safe_subject = "".join(c for c in subject if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{timestamp}_{safe_subject[:30]}.html"
        filepath = self.dev_email_dir / filename

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"<!-- EMAIL METADATA\n")
            f.write(f"From: {self.email_from}\n")
            f.write(f"To: {to_email}\n")
            f.write(f"Subject: {subject}\n")
            f.write(f"Timestamp: {datetime.now(timezone.utc).isoformat()}\n")
            f.write(f"-->\n\n")
            f.write(html_content)

        logger.info(f"Email saved to: {filepath}")
        return True

    async def _send_email_production(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        reply_to: Optional[str] = None,
        tags: Optional[List[dict]] = None,
    ) -> bool:
        """
        Production email sender using Resend API with retry logic.

        Uses exponential backoff for transient failures.
        """
        if not self._resend_configured:
            logger.error("Resend not configured. Set EMAIL_API_KEY in environment.")
            return False

        import resend

        # Build email params
        params: resend.Emails.SendParams = {
            "from": self.email_from,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        # Optional fields
        if text_content:
            params["text"] = text_content

        effective_reply_to = reply_to or self.reply_to
        if effective_reply_to:
            params["reply_to"] = [effective_reply_to]

        if tags:
            params["tags"] = tags

        # Send with retry logic
        last_exception = None
        for attempt in range(MAX_RETRIES):
            try:
                response = resend.Emails.send(params)

                if response and response.get("id"):
                    logger.info(
                        f"Email sent successfully. ID: {response['id']}, "
                        f"To: {to_email}, Attempt: {attempt + 1}"
                    )
                    return True
                else:
                    logger.warning(
                        f"Email send returned no ID. Response: {response}, "
                        f"To: {to_email}, Attempt: {attempt + 1}"
                    )
                    # Don't retry on successful response without ID - likely a Resend issue
                    return False

            except Exception as e:
                last_exception = e

                # Check if error is retryable
                if not self._is_retryable_error(e):
                    logger.error(
                        f"Non-retryable email error to {to_email}: {e}",
                        exc_info=True
                    )
                    return False

                # Calculate delay with exponential backoff
                delay = min(
                    INITIAL_RETRY_DELAY * (2 ** attempt),
                    MAX_RETRY_DELAY
                )

                logger.warning(
                    f"Email send failed (attempt {attempt + 1}/{MAX_RETRIES}), "
                    f"retrying in {delay}s. Error: {e}"
                )

                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(delay)

        logger.error(
            f"Failed to send email to {to_email} after {MAX_RETRIES} attempts. "
            f"Last error: {last_exception}",
            exc_info=True
        )
        return False

    def _is_retryable_error(self, error: Exception) -> bool:
        """
        Determine if an error is transient and worth retrying.

        Returns True for network errors, rate limits, and server errors.
        Returns False for validation errors, auth errors, etc.
        """
        error_str = str(error).lower()

        # Non-retryable errors (client-side issues)
        non_retryable_patterns = [
            "invalid",
            "validation",
            "unauthorized",
            "forbidden",
            "not found",
            "bad request",
            "invalid api key",
            "domain not verified",
        ]

        for pattern in non_retryable_patterns:
            if pattern in error_str:
                return False

        # Retryable errors (transient issues)
        retryable_patterns = [
            "timeout",
            "connection",
            "rate limit",
            "too many requests",
            "server error",
            "502",
            "503",
            "504",
            "network",
        ]

        for pattern in retryable_patterns:
            if pattern in error_str:
                return True

        # Default to retrying unknown errors
        return True

    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        user_name: Optional[str] = None,
    ) -> bool:
        """
        Send password reset email using template.

        Args:
            to_email: User's email address
            reset_token: Password reset token
            user_name: User's name (optional)

        Returns:
            True if email was sent successfully
        """
        reset_url = f"{settings.FRONTEND_URL}/password-reset/reset?token={reset_token}"

        text_content = f"""
Password Reset Request

Hello{f" {user_name}" if user_name else ""},

We received a request to reset your Critvue password.

Click this link to reset your password:
{reset_url}

This link expires in 15 minutes for your security.

If you didn't request a password reset, you can safely ignore this email.

---
This is an automated message from Critvue. Please do not reply to this email.
"""

        return await self.send_templated_email(
            to_email=to_email,
            subject="Reset Your Critvue Password",
            template_name="password_reset.html",
            context={
                "user_name": user_name,
                "reset_url": reset_url,
            },
            text_content=text_content,
            tags=[{"name": "category", "value": "password_reset"}],
        )

    async def send_welcome_email(
        self,
        to_email: str,
        user_name: Optional[str] = None,
    ) -> bool:
        """Send welcome email to new users using template."""
        dashboard_url = f"{settings.FRONTEND_URL}/dashboard"

        text_content = f"""
Welcome to Critvue!

Hi{f" {user_name}" if user_name else ""},

Thanks for joining Critvue! We're excited to help you get better feedback on your creative work.

Here's what you can do:
- Get AI Feedback: Instant, structured feedback on your designs, writing, and more.
- Request Expert Reviews: Connect with skilled reviewers for in-depth critiques.
- Build Your Portfolio: Showcase your best work with verified reviews.

Get started: {dashboard_url}

If you have any questions, we're here to help!
"""

        return await self.send_templated_email(
            to_email=to_email,
            subject="Welcome to Critvue!",
            template_name="welcome.html",
            context={
                "user_name": user_name,
                "dashboard_url": dashboard_url,
            },
            text_content=text_content,
            tags=[{"name": "category", "value": "welcome"}],
        )

    async def send_review_completed_email(
        self,
        to_email: str,
        user_name: Optional[str] = None,
        review_title: str = "Your project",
        reviewer_name: str = "A reviewer",
        review_url: Optional[str] = None,
    ) -> bool:
        """Send email when a review is completed using template."""
        view_url = review_url or f"{settings.FRONTEND_URL}/dashboard"

        text_content = f"""
Your Review is Ready!

Hi{f" {user_name}" if user_name else ""},

Great news! {reviewer_name} has completed their review of your work.

Project: {review_title}

View your review: {view_url}

We hope the feedback helps you improve your work!
"""

        return await self.send_templated_email(
            to_email=to_email,
            subject=f"Your review is ready: {review_title}",
            template_name="review_completed.html",
            context={
                "user_name": user_name,
                "review_title": review_title,
                "reviewer_name": reviewer_name,
                "review_url": view_url,
            },
            text_content=text_content,
            tags=[{"name": "category", "value": "review_completed"}],
        )

    async def send_payment_failed_email(
        self,
        to_email: str,
        user_name: Optional[str] = None,
        amount: Optional[str] = None,
    ) -> bool:
        """Send email when a payment fails using template."""
        billing_url = f"{settings.FRONTEND_URL}/settings/billing"

        text_content = f"""
Payment Failed

Hi{f" {user_name}" if user_name else ""},

We couldn't process your payment{f" of {amount}" if amount else ""}.

This could happen because:
- Your card has expired
- Insufficient funds
- Your bank declined the transaction

Please update your payment method: {billing_url}

Questions? Contact us at support@critvue.com
"""

        return await self.send_templated_email(
            to_email=to_email,
            subject="Action Required: Payment Failed",
            template_name="payment_failed.html",
            context={
                "user_name": user_name,
                "amount": amount,
                "billing_url": billing_url,
            },
            text_content=text_content,
            tags=[{"name": "category", "value": "payment_failed"}],
        )

    async def send_email_verification(
        self,
        to_email: str,
        verification_token: str,
        user_name: Optional[str] = None,
    ) -> bool:
        """
        Send email verification email using template.

        Args:
            to_email: User's email address
            verification_token: Email verification token
            user_name: User's name (optional)

        Returns:
            True if email was sent successfully
        """
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"

        text_content = f"""
Verify Your Email

Hi{f" {user_name}" if user_name else ""},

Thanks for signing up for Critvue! Please verify your email address.

Click this link to verify: {verification_url}

This link expires in 24 hours.

If you didn't create an account, you can safely ignore this email.

---
This is an automated message from Critvue.
"""

        return await self.send_templated_email(
            to_email=to_email,
            subject="Verify Your Email - Critvue",
            template_name="email_verification.html",
            context={
                "user_name": user_name,
                "verification_url": verification_url,
            },
            text_content=text_content,
            tags=[{"name": "category", "value": "email_verification"}],
        )

    async def send_digest_email(
        self,
        to_email: str,
        user_name: Optional[str] = None,
        notifications: Optional[List[Dict[str, Any]]] = None,
        digest_type: str = "Daily",
        digest_period: str = "day",
    ) -> bool:
        """
        Send email digest with accumulated notifications.

        Args:
            to_email: User's email address
            user_name: User's name (optional)
            notifications: List of notification dicts with title, message, action_url, etc.
            digest_type: Type of digest ("Daily" or "Weekly")
            digest_period: Period description ("day" or "week")

        Returns:
            True if email was sent successfully
        """
        dashboard_url = f"{settings.FRONTEND_URL}/dashboard"
        notifications = notifications or []

        # Generate plain text version
        notification_text = ""
        for n in notifications:
            notification_text += f"\n- {n.get('title', 'Notification')}: {n.get('message', '')}"
            if n.get('action_url'):
                notification_text += f"\n  View: {n['action_url']}"

        text_content = f"""
Your {digest_type} Digest

Hi{f" {user_name}" if user_name else ""},

Here's a summary of your notifications from the past {digest_period}:
{notification_text if notifications else "No new notifications this " + digest_period + "."}

Go to Dashboard: {dashboard_url}
"""

        return await self.send_templated_email(
            to_email=to_email,
            subject=f"Your {digest_type} Digest - Critvue",
            template_name="digest.html",
            context={
                "user_name": user_name,
                "notifications": notifications,
                "digest_type": digest_type,
                "digest_period": digest_period,
                "dashboard_url": dashboard_url,
            },
            text_content=text_content,
            tags=[{"name": "category", "value": f"digest_{digest_type.lower()}"}],
        )


# Singleton instance - initialized on first use
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get or create the email service singleton"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service


# Convenience alias
email_service = get_email_service()


# Convenience functions for backward compatibility
async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
) -> bool:
    """Send a generic email"""
    return await get_email_service().send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
    )


async def send_password_reset_email(
    to_email: str,
    reset_token: str,
    user_name: Optional[str] = None
) -> bool:
    """Send password reset email"""
    return await get_email_service().send_password_reset_email(
        to_email=to_email,
        reset_token=reset_token,
        user_name=user_name
    )


async def send_welcome_email(
    to_email: str,
    user_name: Optional[str] = None
) -> bool:
    """Send welcome email to new users"""
    return await get_email_service().send_welcome_email(
        to_email=to_email,
        user_name=user_name
    )


async def send_review_completed_email(
    to_email: str,
    user_name: Optional[str] = None,
    review_title: str = "Your project",
    reviewer_name: str = "A reviewer",
    review_url: Optional[str] = None,
) -> bool:
    """Send review completed notification"""
    return await get_email_service().send_review_completed_email(
        to_email=to_email,
        user_name=user_name,
        review_title=review_title,
        reviewer_name=reviewer_name,
        review_url=review_url,
    )


async def send_payment_failed_email(
    to_email: str,
    user_name: Optional[str] = None,
    amount: Optional[str] = None,
) -> bool:
    """Send payment failed notification"""
    return await get_email_service().send_payment_failed_email(
        to_email=to_email,
        user_name=user_name,
        amount=amount,
    )


async def send_email_verification(
    to_email: str,
    verification_token: str,
    user_name: Optional[str] = None,
) -> bool:
    """Send email verification"""
    return await get_email_service().send_email_verification(
        to_email=to_email,
        verification_token=verification_token,
        user_name=user_name,
    )


async def send_digest_email(
    to_email: str,
    user_name: Optional[str] = None,
    notifications: Optional[List[Dict[str, Any]]] = None,
    digest_type: str = "Daily",
    digest_period: str = "day",
) -> bool:
    """Send email digest with accumulated notifications"""
    return await get_email_service().send_digest_email(
        to_email=to_email,
        user_name=user_name,
        notifications=notifications,
        digest_type=digest_type,
        digest_period=digest_period,
    )
