"""Pydantic schemas for privacy settings"""

from typing import Optional
from pydantic import BaseModel
from enum import Enum


class ProfileVisibility(str, Enum):
    """Profile visibility options"""
    PUBLIC = "public"
    CONNECTIONS = "connections"
    PRIVATE = "private"


class PrivacySettingsBase(BaseModel):
    """Base privacy settings schema"""
    profile_visibility: ProfileVisibility = ProfileVisibility.PUBLIC
    show_on_leaderboard: bool = True
    show_karma_publicly: bool = True
    show_activity_status: bool = True
    allow_review_discovery: bool = True


class PrivacySettingsResponse(PrivacySettingsBase):
    """Privacy settings response schema"""

    class Config:
        from_attributes = True


class PrivacySettingsUpdate(BaseModel):
    """Privacy settings update schema - all fields optional"""
    profile_visibility: Optional[ProfileVisibility] = None
    show_on_leaderboard: Optional[bool] = None
    show_karma_publicly: Optional[bool] = None
    show_activity_status: Optional[bool] = None
    allow_review_discovery: Optional[bool] = None
