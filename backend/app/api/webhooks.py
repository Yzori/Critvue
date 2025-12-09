"""Webhook handlers for external services"""

import logging
from typing import Any, Dict
import stripe
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.services.subscription_service import SubscriptionService
from app.services.payment_service import PaymentService
from app.core.exceptions import InvalidInputError, InternalError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post(
    "/stripe",
    status_code=status.HTTP_200_OK,
    summary="Handle Stripe webhook events"
)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """
    Handle Stripe webhook events for subscription management.

    This endpoint processes events from Stripe including:
    - subscription.created: New subscription created
    - subscription.updated: Subscription status changed
    - subscription.deleted: Subscription cancelled
    - invoice.payment_succeeded: Payment successful
    - invoice.payment_failed: Payment failed

    Security:
    - Validates webhook signature to ensure authenticity
    - Uses Stripe's webhook secret for verification

    Returns:
        Success message

    Raises:
        HTTPException: If signature verification fails or processing error occurs
    """
    # Get the raw request body for signature verification
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        logger.warning("Stripe webhook received without signature header")
        raise InvalidInputError(message="Missing stripe-signature header")

    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.error("Stripe webhook secret not configured")
        raise InternalError(message="Webhook secret not configured")

    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        logger.warning(f"Invalid webhook payload: {str(e)}")
        raise InvalidInputError(message="Invalid payload")
    except stripe.SignatureVerificationError as e:
        # Invalid signature
        logger.warning(f"Invalid webhook signature: {str(e)}")
        raise InvalidInputError(message="Invalid signature")

    # Get event type and data
    event_type = event["type"]
    event_data = event["data"]["object"]

    logger.info(f"Received Stripe webhook: {event_type} (id: {event['id']})")

    try:
        # Handle different event types
        if event_type == "customer.subscription.created":
            await SubscriptionService.handle_subscription_created(event_data, db)

        elif event_type == "customer.subscription.updated":
            await SubscriptionService.handle_subscription_updated(event_data, db)

        elif event_type == "customer.subscription.deleted":
            await SubscriptionService.handle_subscription_deleted(event_data, db)

        elif event_type == "invoice.payment_succeeded":
            await SubscriptionService.handle_invoice_payment_succeeded(event_data, db)

        elif event_type == "invoice.payment_failed":
            await SubscriptionService.handle_invoice_payment_failed(event_data, db)

        # Payment Intent events (expert review payments)
        elif event_type == "payment_intent.succeeded":
            await PaymentService.handle_payment_success(event_data, db)

        elif event_type == "payment_intent.payment_failed":
            await PaymentService.handle_payment_failed(event_data, db)

        # Refund events
        elif event_type == "charge.refunded":
            await PaymentService.handle_refund_completed(event_data, db)

        # Connect account events (reviewer payouts)
        elif event_type == "account.updated":
            await PaymentService.handle_connect_account_updated(event_data, db)

        else:
            logger.info(f"Unhandled webhook event type: {event_type}")

        return {"status": "success", "event_type": event_type}

    except Exception as e:
        logger.error(f"Error processing webhook {event_type}: {str(e)}", exc_info=True)
        # Return 200 to acknowledge receipt, but log the error
        # Stripe will retry failed webhooks automatically
        return {"status": "error", "message": str(e)}
