"""
Base module for payment services.

Contains shared utilities and Stripe initialization.
"""

import logging
import stripe
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_API_KEY
