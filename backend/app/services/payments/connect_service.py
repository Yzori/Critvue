"""
Stripe Connect Service.

Handles Stripe Connect account management for reviewers.
"""

from typing import Dict, Any

import stripe
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.payments.base import logger
from app.core.exceptions import InvalidStateError


class StripeConnectService:
    """Service for managing Stripe Connect accounts"""

    @staticmethod
    async def create_connect_account(
        user: User,
        db: AsyncSession
    ) -> str:
        """
        Create a Stripe Connect Express account for a reviewer.

        Args:
            user: The user to create account for
            db: Database session

        Returns:
            The Connect account ID
        """
        if user.stripe_connect_account_id:
            return user.stripe_connect_account_id

        account = stripe.Account.create(
            type="express",
            email=user.email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True}
            },
            metadata={
                "user_id": str(user.id),
                "platform": "critvue"
            }
        )

        user.stripe_connect_account_id = account.id
        await db.commit()

        logger.info(f"Created Connect account {account.id} for user {user.id}")

        return account.id

    @staticmethod
    async def create_connect_onboarding_link(
        user: User,
        return_url: str,
        refresh_url: str,
        db: AsyncSession
    ) -> str:
        """
        Create a Stripe Connect onboarding link.

        Args:
            user: The user to onboard
            return_url: URL to redirect after completion
            refresh_url: URL to redirect if link expires
            db: Database session

        Returns:
            The onboarding URL
        """
        # Ensure account exists
        if not user.stripe_connect_account_id:
            await StripeConnectService.create_connect_account(user, db)

        account_link = stripe.AccountLink.create(
            account=user.stripe_connect_account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding"
        )

        return account_link.url

    @staticmethod
    async def create_connect_dashboard_link(user: User) -> str:
        """
        Create a link to the Stripe Connect Express dashboard.

        Args:
            user: The user with Connect account

        Returns:
            Dashboard URL

        Raises:
            ValueError: If user has no Connect account
        """
        if not user.stripe_connect_account_id:
            raise InvalidStateError(message="User does not have a Connect account")

        login_link = stripe.Account.create_login_link(
            user.stripe_connect_account_id
        )

        return login_link.url

    @staticmethod
    async def check_connect_status(
        user: User,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Check Stripe Connect account status and update user record.

        Args:
            user: The user to check
            db: Database session

        Returns:
            Dict with status information
        """
        if not user.stripe_connect_account_id:
            return {
                "is_onboarded": False,
                "payouts_enabled": False,
                "account_id": None,
                "details_submitted": False
            }

        try:
            account = stripe.Account.retrieve(user.stripe_connect_account_id)

            is_onboarded = account.details_submitted
            payouts_enabled = account.payouts_enabled

            # Update user record if status changed
            if (user.stripe_connect_onboarded != is_onboarded or
                user.stripe_connect_payouts_enabled != payouts_enabled):
                user.stripe_connect_onboarded = is_onboarded
                user.stripe_connect_payouts_enabled = payouts_enabled
                await db.commit()
                logger.info(
                    f"Updated Connect status for user {user.id}: "
                    f"onboarded={is_onboarded}, payouts_enabled={payouts_enabled}"
                )

            return {
                "is_onboarded": is_onboarded,
                "payouts_enabled": payouts_enabled,
                "account_id": user.stripe_connect_account_id,
                "details_submitted": account.details_submitted
            }

        except stripe.StripeError as e:
            logger.error(f"Failed to check Connect status for user {user.id}: {e}")
            return {
                "is_onboarded": user.stripe_connect_onboarded,
                "payouts_enabled": user.stripe_connect_payouts_enabled,
                "account_id": user.stripe_connect_account_id,
                "details_submitted": False
            }
