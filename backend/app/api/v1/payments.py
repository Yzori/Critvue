"""
Payment API endpoints for expert review payments and Stripe Connect

Endpoints:
- POST /payments/create-payment-intent - Create Payment Intent for checkout
- GET /payments/status/{review_request_id} - Get payment status
- POST /payments/calculate - Calculate payment breakdown
- POST /payments/connect/onboard - Start Stripe Connect onboarding
- GET /payments/connect/status - Get Connect account status
- POST /payments/connect/dashboard-link - Get link to Connect dashboard
- GET /payments/connect/balance - Get available balance
- GET /payments/connect/payouts - Get payout history
"""

import logging
from decimal import Decimal
from typing import Dict, Any

import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.core.exceptions import InvalidInputError, InternalError, ExternalServiceError
from app.models.review_request import ReviewRequest, ReviewType
from app.services.payment_service import PaymentService
from app.schemas.payment import (
    CreatePaymentIntentRequest,
    CreatePaymentIntentResponse,
    PaymentStatusResponse,
    ConnectOnboardingRequest,
    ConnectOnboardingResponse,
    ConnectStatusResponse,
    ConnectDashboardLinkResponse,
    AvailableBalanceResponse,
    PayoutHistoryResponse,
    PayoutHistoryItem,
    CalculatePaymentRequest,
    CalculatePaymentResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


# ===== Payment Intent Endpoints =====

@router.post(
    "/create-payment-intent",
    response_model=CreatePaymentIntentResponse,
    summary="Create payment intent for expert review"
)
async def create_payment_intent(
    request: CreatePaymentIntentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CreatePaymentIntentResponse:
    """
    Create a Stripe Payment Intent for an expert review request.

    The user must own the review request and it must be an expert review type.
    Returns a client_secret to complete payment on the frontend.
    """
    # Get review request
    result = await db.execute(
        select(ReviewRequest).where(ReviewRequest.id == request.review_request_id)
    )
    review_request = result.scalar_one_or_none()

    if not review_request:
        raise NotFoundError(message="Review request not found"
        )

    # Verify ownership
    if review_request.user_id != current_user.id:
        raise ForbiddenError(message="You can only pay for your own review requests"
        )

    # Verify it's an expert review
    if review_request.review_type != ReviewType.EXPERT:
        raise InvalidInputError(message="Payment is only required for expert reviews"
        )

    try:
        result = await PaymentService.create_payment_intent(
            review_request=review_request,
            user=current_user,
            db=db
        )

        return CreatePaymentIntentResponse(
            client_secret=result["client_secret"],
            payment_intent_id=result["payment_intent_id"],
            amount=result["amount"],
            currency="usd"
        )

    except ValueError as e:
        raise InvalidInputError(message=str(e)
        )
    except stripe.StripeError as e:
        logger.error(f"Stripe error creating payment intent: {e}")
        raise ExternalServiceError(service="Stripe", message="Failed to create payment. Please try again.")


@router.get(
    "/status/{review_request_id}",
    response_model=PaymentStatusResponse,
    summary="Get payment status for a review request"
)
async def get_payment_status(
    review_request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> PaymentStatusResponse:
    """
    Get the payment status for a review request.
    """
    # Get review request
    result = await db.execute(
        select(ReviewRequest).where(ReviewRequest.id == review_request_id)
    )
    review_request = result.scalar_one_or_none()

    if not review_request:
        raise NotFoundError(message="Review request not found"
        )

    # Verify ownership
    if review_request.user_id != current_user.id:
        raise ForbiddenError(message="You can only view payment status for your own requests"
        )

    # Determine payment status
    is_paid = review_request.payment_captured_at is not None

    # If there's a Payment Intent, check its status
    payment_status = "not_required"
    if review_request.review_type == ReviewType.EXPERT:
        if is_paid:
            payment_status = "paid"
        elif review_request.stripe_payment_intent_id:
            payment_status = "pending"
        else:
            payment_status = "awaiting_payment"

    return PaymentStatusResponse(
        payment_status=payment_status,
        payment_intent_id=review_request.stripe_payment_intent_id,
        amount=review_request.budget,
        payment_captured_at=review_request.payment_captured_at,
        is_paid=is_paid
    )


@router.post(
    "/calculate",
    response_model=CalculatePaymentResponse,
    summary="Calculate payment breakdown"
)
async def calculate_payment(
    request: CalculatePaymentRequest,
    current_user: User = Depends(get_current_user)
) -> CalculatePaymentResponse:
    """
    Calculate payment breakdown including platform fee and Pro discount.
    Use this to show pricing before checkout.
    """
    is_pro = PaymentService.is_pro_user_active(current_user)

    breakdown = PaymentService.calculate_payment_breakdown(
        budget=request.budget,
        reviews_requested=request.reviews_requested,
        is_pro_user=is_pro if request.apply_pro_discount else False
    )

    return CalculatePaymentResponse(breakdown=breakdown)


# ===== Stripe Connect Endpoints =====

@router.post(
    "/connect/onboard",
    response_model=ConnectOnboardingResponse,
    summary="Start Stripe Connect onboarding"
)
async def start_connect_onboarding(
    request: ConnectOnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ConnectOnboardingResponse:
    """
    Start Stripe Connect onboarding for a reviewer.
    Returns a URL to complete the onboarding process.
    """
    try:
        # Create account if needed
        account_id = await PaymentService.create_connect_account(current_user, db)

        # Create onboarding link
        onboarding_url = await PaymentService.create_connect_onboarding_link(
            user=current_user,
            return_url=request.return_url,
            refresh_url=request.refresh_url,
            db=db
        )

        return ConnectOnboardingResponse(
            account_id=account_id,
            onboarding_url=onboarding_url
        )

    except stripe.StripeError as e:
        logger.error(f"Stripe error during Connect onboarding: {e}")
        # Check if Connect isn't enabled on the platform
        error_message = str(e)
        if "signed up for Connect" in error_message:
            raise ExternalServiceError(service="Stripe", message="Payout setup is not yet available. Please check back later.")
        raise ExternalServiceError(service="Stripe", message="Failed to start onboarding. Please try again.")


@router.get(
    "/connect/status",
    response_model=ConnectStatusResponse,
    summary="Get Stripe Connect account status"
)
async def get_connect_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ConnectStatusResponse:
    """
    Get the current user's Stripe Connect account status.
    """
    status_info = await PaymentService.check_connect_status(current_user, db)

    return ConnectStatusResponse(
        is_onboarded=status_info["is_onboarded"],
        payouts_enabled=status_info["payouts_enabled"],
        account_id=status_info["account_id"],
        details_submitted=status_info["details_submitted"]
    )


@router.post(
    "/connect/dashboard-link",
    response_model=ConnectDashboardLinkResponse,
    summary="Get link to Stripe Connect dashboard"
)
async def get_connect_dashboard_link(
    current_user: User = Depends(get_current_user)
) -> ConnectDashboardLinkResponse:
    """
    Get a link to the Stripe Connect Express dashboard.
    User must have a Connect account set up.
    """
    try:
        dashboard_url = await PaymentService.create_connect_dashboard_link(current_user)
        return ConnectDashboardLinkResponse(dashboard_url=dashboard_url)

    except ValueError as e:
        raise InvalidInputError(message=str(e)
        )
    except stripe.StripeError as e:
        logger.error(f"Stripe error getting dashboard link: {e}")
        raise ExternalServiceError(service="Stripe", message="Failed to get dashboard link. Please try again.")


@router.get(
    "/connect/balance",
    response_model=AvailableBalanceResponse,
    summary="Get available balance for withdrawal"
)
async def get_available_balance(
    current_user: User = Depends(get_current_user)
) -> AvailableBalanceResponse:
    """
    Get the available balance in the reviewer's Stripe Connect account.
    """
    if not current_user.stripe_connect_account_id:
        return AvailableBalanceResponse(
            available_balance=Decimal("0"),
            pending_balance=Decimal("0"),
            currency="usd"
        )

    balance = await PaymentService.get_available_balance(current_user)

    return AvailableBalanceResponse(
        available_balance=balance["available_balance"],
        pending_balance=balance["pending_balance"],
        currency="usd"
    )


@router.get(
    "/connect/payouts",
    response_model=PayoutHistoryResponse,
    summary="Get payout history"
)
async def get_payout_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user)
) -> PayoutHistoryResponse:
    """
    Get the reviewer's payout history from Stripe Connect.
    """
    if not current_user.stripe_connect_account_id:
        return PayoutHistoryResponse(
            payouts=[],
            total_paid=Decimal("0"),
            has_more=False
        )

    payouts = await PaymentService.get_payout_history(current_user, limit=limit)

    # Calculate total paid
    total_paid = sum(
        p["amount"] for p in payouts
        if p["status"] == "paid"
    )

    return PayoutHistoryResponse(
        payouts=[
            PayoutHistoryItem(
                payout_id=p["payout_id"],
                amount=p["amount"],
                status=p["status"],
                created_at=p["created_at"],
                arrival_date=p["arrival_date"]
            )
            for p in payouts
        ],
        total_paid=Decimal(str(total_paid)),
        has_more=len(payouts) >= limit
    )
