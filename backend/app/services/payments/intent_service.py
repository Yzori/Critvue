"""
Payment Intent Service.

Handles creating and managing Stripe Payment Intents for expert reviews.
"""

import logging
from decimal import Decimal
from typing import Dict, Any

import stripe
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.review_request import ReviewRequest, ReviewType
from app.services.payments.base import logger
from app.services.payments.calculation import PaymentCalculationService
from app.core.exceptions import InvalidInputError, InvalidStateError


class PaymentIntentService:
    """Service for creating and managing Payment Intents"""

    @staticmethod
    async def create_payment_intent(
        review_request: ReviewRequest,
        user: User,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Create a Stripe Payment Intent for an expert review request.

        Args:
            review_request: The review request to pay for
            user: The user making the payment
            db: Database session

        Returns:
            Dict with client_secret and payment_intent_id

        Raises:
            ValueError: If validation fails
            stripe.StripeError: If Stripe API fails
        """
        # Validate review request
        if review_request.review_type != ReviewType.EXPERT:
            raise InvalidInputError(message="Payment is only required for expert reviews")

        if review_request.stripe_payment_intent_id:
            # Payment Intent already exists, retrieve it
            try:
                intent = stripe.PaymentIntent.retrieve(review_request.stripe_payment_intent_id)
                if intent.status in ["succeeded", "processing"]:
                    raise InvalidStateError(message="Payment has already been processed")
                return {
                    "client_secret": intent.client_secret,
                    "payment_intent_id": intent.id,
                    "amount": Decimal(intent.amount) / 100
                }
            except stripe.StripeError:
                # Intent doesn't exist anymore, create new one
                pass

        if not review_request.budget:
            raise InvalidInputError(message="Budget is required for expert reviews")

        # Calculate amount
        is_pro = PaymentCalculationService.is_pro_user_active(user)
        breakdown = PaymentCalculationService.calculate_payment_breakdown(
            budget=review_request.budget,
            reviews_requested=review_request.reviews_requested,
            is_pro_user=is_pro
        )

        # Amount in cents for Stripe
        amount_cents = int(breakdown.total * 100)

        # Ensure user has Stripe customer ID
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.full_name,
                metadata={"user_id": str(user.id)}
            )
            user.stripe_customer_id = customer.id
            await db.commit()
            logger.info(f"Created Stripe customer {customer.id} for user {user.id}")

        # Create Payment Intent
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            customer=user.stripe_customer_id,
            metadata={
                "review_request_id": str(review_request.id),
                "user_id": str(user.id),
                "reviews_requested": str(review_request.reviews_requested),
                "is_pro_user": str(is_pro),
                "discount_applied": str(breakdown.discount_amount)
            },
            description=f"Expert review: {review_request.title[:50]}",
            automatic_payment_methods={"enabled": True}
        )

        # Store Payment Intent ID
        review_request.stripe_payment_intent_id = intent.id
        await db.commit()

        logger.info(f"Created Payment Intent {intent.id} for review request {review_request.id}")

        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": breakdown.total
        }
