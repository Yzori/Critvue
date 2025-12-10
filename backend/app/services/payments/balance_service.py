"""
Balance Service.

Handles balance inquiries and payout history for reviewers.
"""

from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Any

import stripe

from app.models.user import User
from app.services.payments.base import logger


class BalanceService:
    """Service for balance and payout operations"""

    @staticmethod
    async def get_available_balance(user: User) -> Dict[str, Decimal]:
        """
        Get available balance from Stripe Connect account.

        Args:
            user: The reviewer user

        Returns:
            Dict with available and pending balances
        """
        if not user.stripe_connect_account_id:
            return {
                "available_balance": Decimal("0"),
                "pending_balance": Decimal("0")
            }

        try:
            balance = stripe.Balance.retrieve(
                stripe_account=user.stripe_connect_account_id
            )

            # Get USD balances (Stripe returns amounts in cents)
            available = Decimal("0")
            pending = Decimal("0")

            for item in balance.available:
                if item.currency == "usd":
                    available = Decimal(item.amount) / 100

            for item in balance.pending:
                if item.currency == "usd":
                    pending = Decimal(item.amount) / 100

            return {
                "available_balance": available,
                "pending_balance": pending
            }

        except stripe.StripeError as e:
            logger.error(f"Failed to get balance for user {user.id}: {e}")
            return {
                "available_balance": Decimal("0"),
                "pending_balance": Decimal("0")
            }

    @staticmethod
    async def get_payout_history(
        user: User,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get payout history for a reviewer.

        Args:
            user: The reviewer user
            limit: Max number of payouts to return

        Returns:
            List of payout records
        """
        if not user.stripe_connect_account_id:
            return []

        try:
            payouts = stripe.Payout.list(
                limit=limit,
                stripe_account=user.stripe_connect_account_id
            )

            return [
                {
                    "payout_id": p.id,
                    "amount": Decimal(p.amount) / 100,
                    "status": p.status,
                    "created_at": datetime.fromtimestamp(p.created),
                    "arrival_date": datetime.fromtimestamp(p.arrival_date) if p.arrival_date else None
                }
                for p in payouts.data
            ]

        except stripe.StripeError as e:
            logger.error(f"Failed to get payout history for user {user.id}: {e}")
            return []
