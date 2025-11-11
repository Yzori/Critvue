"""Email service abstraction layer

This module provides a clean abstraction for email sending that works in both
development and production environments.

Development: Logs emails to console/file
Production: Integrates with email service providers (SendGrid, AWS SES, etc.)
"""

import logging
from typing import Optional, List
from datetime import datetime
from pathlib import Path

from app.core.config import settings


# Configure logging
logger = logging.getLogger(__name__)


class EmailService:
    """
    Email service abstraction

    Usage:
        email_service = EmailService()
        await email_service.send_password_reset_email(
            to_email="user@example.com",
            reset_token="abc123...",
            user_name="John Doe"
        )
    """

    def __init__(self, environment: str = "development"):
        """
        Initialize email service

        Args:
            environment: "development" or "production"
        """
        self.environment = environment
        self.email_from = settings.EMAIL_FROM

        # In development, optionally save emails to file
        self.dev_email_dir = Path("dev_emails")
        if environment == "development":
            self.dev_email_dir.mkdir(exist_ok=True)

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML body of email
            text_content: Plain text body (fallback)

        Returns:
            True if email was sent successfully

        Raises:
            Exception: If email sending fails in production
        """
        if self.environment == "development":
            return await self._send_email_dev(to_email, subject, html_content, text_content)
        else:
            return await self._send_email_production(to_email, subject, html_content, text_content)

    async def _send_email_dev(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Development email sender - logs to console and saves to file

        This makes it easy to test email flows without actually sending emails
        """
        # Log to console
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
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_subject = "".join(c for c in subject if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{timestamp}_{safe_subject[:30]}.html"
        filepath = self.dev_email_dir / filename

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"<!-- EMAIL METADATA\n")
            f.write(f"From: {self.email_from}\n")
            f.write(f"To: {to_email}\n")
            f.write(f"Subject: {subject}\n")
            f.write(f"Timestamp: {datetime.utcnow().isoformat()}\n")
            f.write(f"-->\n\n")
            f.write(html_content)

        logger.info(f"Email saved to: {filepath}")

        return True

    async def _send_email_production(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Production email sender - integrates with email service provider

        TODO: Implement integration with your email service provider
        Options:
        - SendGrid
        - AWS SES
        - Mailgun
        - Postmark
        - Resend
        """
        # Example implementation with SendGrid (commented out)
        """
        import sendgrid
        from sendgrid.helpers.mail import Mail, Email, To, Content

        sg = sendgrid.SendGridAPIClient(api_key=settings.EMAIL_API_KEY)
        from_email = Email(self.email_from)
        to_email = To(to_email)
        content = Content("text/html", html_content)
        mail = Mail(from_email, to_email, subject, content)

        try:
            response = sg.client.mail.send.post(request_body=mail.get())
            return response.status_code in [200, 201, 202]
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise
        """

        # Placeholder for now
        logger.warning("Production email sending not yet implemented")
        logger.info(f"Would send email to: {to_email}, subject: {subject}")
        return True

    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        user_name: Optional[str] = None,
        reset_url_base: str = "http://localhost:3000/reset-password"
    ) -> bool:
        """
        Send password reset email

        Args:
            to_email: User's email address
            reset_token: Password reset token
            user_name: User's name (optional)
            reset_url_base: Base URL for reset page (without token)

        Returns:
            True if email was sent successfully
        """
        # Construct reset URL
        reset_url = f"{reset_url_base}?token={reset_token}"

        # Email subject
        subject = "Reset Your Critvue Password"

        # HTML email content
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
        .content {{
            margin-bottom: 30px;
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
        .button:hover {{
            background: #2980b9;
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
        .security-tips {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }}
        .security-tips ul {{
            margin: 10px 0;
            padding-left: 20px;
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
                <strong>⏱️ This link expires in 15 minutes</strong> for your security.
            </div>

            <div class="security-tips">
                <strong>Security Tips:</strong>
                <ul>
                    <li>Never share your password reset link with anyone</li>
                    <li>Critvue will never ask for your password via email</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Consider enabling two-factor authentication</li>
                </ul>
            </div>

            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        </div>

        <div class="footer">
            <p>This is an automated message from Critvue. Please do not reply to this email.</p>
            <p>&copy; {datetime.utcnow().year} Critvue. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

        # Plain text version (fallback)
        text_content = f"""
Password Reset Request

Hello{f" {user_name}" if user_name else ""},

We received a request to reset your Critvue password.

Click this link to reset your password:
{reset_url}

This link expires in 15 minutes for your security.

If you didn't request a password reset, you can safely ignore this email.

Security Tips:
- Never share your password reset link with anyone
- Critvue will never ask for your password via email
- If you didn't request this reset, please ignore this email

---
This is an automated message from Critvue. Please do not reply to this email.
© {datetime.utcnow().year} Critvue. All rights reserved.
"""

        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )


# Singleton instance
email_service = EmailService(environment="development")


async def send_password_reset_email(
    to_email: str,
    reset_token: str,
    user_name: Optional[str] = None
) -> bool:
    """
    Convenience function to send password reset email

    Args:
        to_email: User's email address
        reset_token: Password reset token
        user_name: User's name (optional)

    Returns:
        True if email was sent successfully
    """
    return await email_service.send_password_reset_email(
        to_email=to_email,
        reset_token=reset_token,
        user_name=user_name
    )
