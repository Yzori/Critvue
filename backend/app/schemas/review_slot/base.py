"""Base Review Slot schemas"""

from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class ReviewSlotBase(BaseModel):
    """Base schema for review slots"""
    review_request_id: int = Field(..., gt=0)


class ReviewSlotCreate(ReviewSlotBase):
    """Schema for creating a review slot (typically automatic)"""
    payment_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
