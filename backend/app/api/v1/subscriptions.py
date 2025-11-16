"""Subscription API endpoints"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.subscription import (
    SubscriptionStatus,
    CreateCheckoutSessionRequest,
    CreateCheckoutSessionResponse,
    CreatePortalSessionRequest,
    CreatePortalSessionResponse,
)
from app.services.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get(
    "/status",
    response_model=SubscriptionStatus,
    summary="Get current subscription status"
)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SubscriptionStatus:
    """
    Get the current user's subscription status and limits.

    Returns:
        - Current tier (free or pro)
        - Subscription status (active, canceled, etc.)
        - Review limits and usage
        - Available benefits (unlimited reviews, discounts, priority queue)
    """
    try:
        status_data = await SubscriptionService.get_subscription_status(current_user)
        return SubscriptionStatus(**status_data)
    except Exception as e:
        logger.error(f"Failed to get subscription status for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscription status"
        )


@router.post(
    "/checkout",
    response_model=CreateCheckoutSessionResponse,
    summary="Create Stripe checkout session"
)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CreateCheckoutSessionResponse:
    """
    Create a Stripe Checkout session to subscribe to Pro tier.

    Args:
        request: Checkout session request with success and cancel URLs

    Returns:
        Checkout URL to redirect user to Stripe payment page

    Raises:
        HTTPException: If user already has active subscription or Stripe error occurs
    """
    try:
        session_data = await SubscriptionService.create_checkout_session(
            user=current_user,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            db=db
        )

        logger.info(f"Created checkout session for user {current_user.id}")
        return CreateCheckoutSessionResponse(**session_data)

    except ValueError as e:
        logger.warning(f"Invalid checkout request for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to create checkout session for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )


@router.post(
    "/portal",
    response_model=CreatePortalSessionResponse,
    summary="Create Stripe customer portal session"
)
async def create_portal_session(
    request: CreatePortalSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CreatePortalSessionResponse:
    """
    Create a Stripe Customer Portal session for subscription management.

    Users can manage their subscription, update payment methods, view invoices, etc.

    Args:
        request: Portal session request with return URL

    Returns:
        Portal URL to redirect user to Stripe customer portal

    Raises:
        HTTPException: If user doesn't have Stripe customer or Stripe error occurs
    """
    try:
        portal_data = await SubscriptionService.create_portal_session(
            user=current_user,
            return_url=request.return_url
        )

        logger.info(f"Created portal session for user {current_user.id}")
        return CreatePortalSessionResponse(**portal_data)

    except ValueError as e:
        logger.warning(f"Invalid portal request for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to create portal session for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create portal session"
        )
