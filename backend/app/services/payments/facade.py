"""
Payment Service Facade.

Provides backward-compatible interface that delegates to specialized services.
"""

from decimal import Decimal
from typing import Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.review_request import ReviewRequest
from app.models.review_slot import ReviewSlot
from app.schemas.payment import PaymentBreakdown

from app.services.payments.calculation import PaymentCalculationService
from app.services.payments.intent_service import PaymentIntentService
from app.services.payments.webhook_handlers import PaymentWebhookHandlers
from app.services.payments.release_service import PaymentReleaseService
from app.services.payments.connect_service import StripeConnectService
from app.services.payments.balance_service import BalanceService


class PaymentFacade:
    """
    Facade for payment operations.

    Provides backward-compatible interface while delegating to specialized services.
    """

    # ===== Payment Calculation =====

    @staticmethod
    def calculate_payment_breakdown(
        budget: Decimal,
        reviews_requested: int,
        is_pro_user: bool = False
    ) -> PaymentBreakdown:
        """Calculate payment breakdown with platform fee and optional Pro discount."""
        return PaymentCalculationService.calculate_payment_breakdown(
            budget=budget,
            reviews_requested=reviews_requested,
            is_pro_user=is_pro_user
        )

    @staticmethod
    def is_pro_user_active(user: User) -> bool:
        """Check if user has active Pro subscription"""
        return PaymentCalculationService.is_pro_user_active(user)

    # ===== Payment Intent Creation =====

    @staticmethod
    async def create_payment_intent(
        review_request: ReviewRequest,
        user: User,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Create a Stripe Payment Intent for an expert review request."""
        return await PaymentIntentService.create_payment_intent(
            review_request=review_request,
            user=user,
            db=db
        )

    # ===== Payment Webhook Handlers =====

    @staticmethod
    async def handle_payment_success(
        payment_intent: Dict[str, Any],
        db: AsyncSession
    ) -> None:
        """Handle payment_intent.succeeded webhook."""
        return await PaymentWebhookHandlers.handle_payment_success(
            payment_intent=payment_intent,
            db=db
        )

    @staticmethod
    async def handle_payment_failed(
        payment_intent: Dict[str, Any],
        db: AsyncSession
    ) -> None:
        """Handle payment_intent.payment_failed webhook."""
        return await PaymentWebhookHandlers.handle_payment_failed(
            payment_intent=payment_intent,
            db=db
        )

    @staticmethod
    async def handle_refund_completed(
        refund: Dict[str, Any],
        db: AsyncSession
    ) -> None:
        """Handle charge.refunded webhook to confirm refund completion."""
        return await PaymentWebhookHandlers.handle_refund_completed(
            refund=refund,
            db=db
        )

    @staticmethod
    async def handle_connect_account_updated(
        account: Dict[str, Any],
        db: AsyncSession
    ) -> None:
        """Handle account.updated webhook for Connect accounts."""
        return await PaymentWebhookHandlers.handle_connect_account_updated(
            account=account,
            db=db
        )

    # ===== Payment Release (to Reviewer) =====

    @staticmethod
    async def release_payment_to_reviewer(
        slot: ReviewSlot,
        reviewer: User,
        db: AsyncSession
    ) -> bool:
        """Release escrowed payment to reviewer via Stripe Connect."""
        return await PaymentReleaseService.release_payment_to_reviewer(
            slot=slot,
            reviewer=reviewer,
            db=db
        )

    # ===== Refund Processing =====

    @staticmethod
    async def process_refund(
        slot: ReviewSlot,
        review_request: ReviewRequest,
        db: AsyncSession
    ) -> bool:
        """Process refund for a rejected review slot."""
        return await PaymentReleaseService.process_refund(
            slot=slot,
            review_request=review_request,
            db=db
        )

    # ===== Stripe Connect Account Management =====

    @staticmethod
    async def create_connect_account(
        user: User,
        db: AsyncSession
    ) -> str:
        """Create a Stripe Connect Express account for a reviewer."""
        return await StripeConnectService.create_connect_account(
            user=user,
            db=db
        )

    @staticmethod
    async def create_connect_onboarding_link(
        user: User,
        return_url: str,
        refresh_url: str,
        db: AsyncSession
    ) -> str:
        """Create a Stripe Connect onboarding link."""
        return await StripeConnectService.create_connect_onboarding_link(
            user=user,
            return_url=return_url,
            refresh_url=refresh_url,
            db=db
        )

    @staticmethod
    async def create_connect_dashboard_link(user: User) -> str:
        """Create a link to the Stripe Connect Express dashboard."""
        return await StripeConnectService.create_connect_dashboard_link(user=user)

    @staticmethod
    async def check_connect_status(
        user: User,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Check Stripe Connect account status and update user record."""
        return await StripeConnectService.check_connect_status(
            user=user,
            db=db
        )

    # ===== Balance and Payouts =====

    @staticmethod
    async def get_available_balance(user: User) -> Dict[str, Decimal]:
        """Get available balance from Stripe Connect account."""
        return await BalanceService.get_available_balance(user=user)

    @staticmethod
    async def get_payout_history(
        user: User,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get payout history for a reviewer."""
        return await BalanceService.get_payout_history(user=user, limit=limit)


# Backward-compatible alias
PaymentService = PaymentFacade
