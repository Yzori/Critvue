"""Payments API routers.

This module consolidates payment-related endpoints:
- transactions: Payment processing (/payments/*)
- subscriptions: Subscription management (/subscriptions/*)
"""

from fastapi import APIRouter

from .transactions import router as transactions_router
from .subscriptions import router as subscriptions_router

# No prefix - each sub-router has its own prefix
router = APIRouter(tags=["payments"])

router.include_router(transactions_router)
router.include_router(subscriptions_router)

__all__ = ["router"]
