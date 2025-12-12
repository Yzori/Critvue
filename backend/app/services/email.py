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

import logging
from typing import Optional, List
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Email service with Resend integration

    Usage:
        email_service = EmailService()
        await email_service.send_email(
            to_email="user@example.com",
            subject="Hello",
            html_content="<h1>Hi there!</h1>"
        )
    """

    def __init__(self):
        """Initialize email service based on environment"""
        self.environment = settings.ENVIRONMENT
        self.email_from = settings.EMAIL_FROM
        self.reply_to = settings.EMAIL_REPLY_TO or None

        # Development email storage
        self.dev_email_dir = Path("dev_emails")
        if not settings.is_production:
            self.dev_email_dir.mkdir(exist_ok=True)

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
        Production email sender using Resend API
        """
        if not self._resend_configured:
            logger.error("Resend not configured. Set EMAIL_API_KEY in environment.")
            return False

        try:
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

            # Send email
            response = resend.Emails.send(params)

            if response and response.get("id"):
                logger.info(f"Email sent successfully. ID: {response['id']}, To: {to_email}")
                return True
            else:
                logger.error(f"Failed to send email. Response: {response}")
                return False

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}", exc_info=True)
            return False

    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        user_name: Optional[str] = None,
    ) -> bool:
        """
        Send password reset email

        Args:
            to_email: User's email address
            reset_token: Password reset token
            user_name: User's name (optional)

        Returns:
            True if email was sent successfully
        """
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        subject = "Reset Your Critvue Password"
        current_year = datetime.now(timezone.utc).year

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            background: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #2c3e50;
            font-size: 24px;
            margin: 0;
        }}
        .button {{
            display: inline-block;
            background: #3498db;
            color: #ffffff !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }}
        .token {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            word-break: break-all;
            margin: 20px 0;
            border-left: 4px solid #3498db;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            text-align: center;
        }}
        .warning {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>

        <div class="content">
            <p>Hello{f" {user_name}" if user_name else ""},</p>

            <p>We received a request to reset your Critvue password. Click the button below to choose a new password:</p>

            <div style="text-align: center;">
                <a href="{reset_url}" class="button">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <div class="token">{reset_url}</div>

            <div class="warning">
                <strong>This link expires in 15 minutes</strong> for your security.
            </div>

            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        </div>

        <div class="footer">
            <p>This is an automated message from Critvue. Please do not reply to this email.</p>
            <p>&copy; {current_year} Critvue. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

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
(c) {current_year} Critvue. All rights reserved.
"""

        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            tags=[{"name": "category", "value": "password_reset"}],
        )

    async def send_welcome_email(
        self,
        to_email: str,
        user_name: Optional[str] = None,
    ) -> bool:
        """Send welcome email to new users"""
        subject = "Welcome to Critvue!"
        current_year = datetime.now(timezone.utc).year
        dashboard_url = f"{settings.FRONTEND_URL}/dashboard"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            background: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #2c3e50;
            font-size: 28px;
            margin: 0;
        }}
        .button {{
            display: inline-block;
            background: #3498db;
            color: #ffffff !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
        }}
        .feature {{
            padding: 15px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 4px;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Critvue!</h1>
        </div>

        <p>Hi{f" {user_name}" if user_name else ""},</p>

        <p>Thanks for joining Critvue! We're excited to help you get better feedback on your creative work.</p>

        <h3>Here's what you can do:</h3>

        <div class="feature">
            <strong>Get AI Feedback</strong> - Instant, structured feedback on your designs, writing, and more.
        </div>

        <div class="feature">
            <strong>Request Expert Reviews</strong> - Connect with skilled reviewers for in-depth critiques.
        </div>

        <div class="feature">
            <strong>Build Your Portfolio</strong> - Showcase your best work with verified reviews.
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{dashboard_url}" class="button">Go to Dashboard</a>
        </div>

        <p>If you have any questions, we're here to help!</p>

        <div class="footer">
            <p>&copy; {current_year} Critvue. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

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

(c) {current_year} Critvue. All rights reserved.
"""

        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
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
        """Send email when a review is completed"""
        subject = f"Your review is ready: {review_title}"
        current_year = datetime.now(timezone.utc).year
        view_url = review_url or f"{settings.FRONTEND_URL}/dashboard"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            background: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #27ae60;
            font-size: 24px;
            margin: 0;
        }}
        .button {{
            display: inline-block;
            background: #27ae60;
            color: #ffffff !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
        }}
        .review-info {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Review is Ready!</h1>
        </div>

        <p>Hi{f" {user_name}" if user_name else ""},</p>

        <p>Great news! {reviewer_name} has completed their review of your work.</p>

        <div class="review-info">
            <strong>Project:</strong> {review_title}
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{view_url}" class="button">View Review</a>
        </div>

        <p>We hope the feedback helps you improve your work!</p>

        <div class="footer">
            <p>&copy; {current_year} Critvue. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

        text_content = f"""
Your Review is Ready!

Hi{f" {user_name}" if user_name else ""},

Great news! {reviewer_name} has completed their review of your work.

Project: {review_title}

View your review: {view_url}

We hope the feedback helps you improve your work!

(c) {current_year} Critvue. All rights reserved.
"""

        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            tags=[{"name": "category", "value": "review_completed"}],
        )

    async def send_payment_failed_email(
        self,
        to_email: str,
        user_name: Optional[str] = None,
        amount: Optional[str] = None,
    ) -> bool:
        """Send email when a payment fails"""
        subject = "Action Required: Payment Failed"
        current_year = datetime.now(timezone.utc).year
        billing_url = f"{settings.FRONTEND_URL}/settings/billing"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            background: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #e74c3c;
            font-size: 24px;
            margin: 0;
        }}
        .button {{
            display: inline-block;
            background: #3498db;
            color: #ffffff !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
        }}
        .alert {{
            background: #fdeaea;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Failed</h1>
        </div>

        <p>Hi{f" {user_name}" if user_name else ""},</p>

        <div class="alert">
            <strong>We couldn't process your payment{f" of {amount}" if amount else ""}.</strong>
        </div>

        <p>This could happen because:</p>
        <ul>
            <li>Your card has expired</li>
            <li>Insufficient funds</li>
            <li>Your bank declined the transaction</li>
        </ul>

        <p>Please update your payment method to continue using Critvue Pro features.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{billing_url}" class="button">Update Payment Method</a>
        </div>

        <div class="footer">
            <p>Questions? Contact us at support@critvue.com</p>
            <p>&copy; {current_year} Critvue. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

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

(c) {current_year} Critvue. All rights reserved.
"""

        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            tags=[{"name": "category", "value": "payment_failed"}],
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
