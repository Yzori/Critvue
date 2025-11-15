"""
Scheduler configuration for background jobs

This module provides access to scheduler settings from the main config.
"""

from app.core.config import settings


class SchedulerSettings:
    """Configuration for review workflow background jobs"""

    @property
    def CLAIM_TIMEOUT_HOURS(self) -> int:
        """Hours before claimed reviews are abandoned"""
        return settings.SCHEDULER_CLAIM_TIMEOUT_HOURS

    @property
    def AUTO_ACCEPT_DAYS(self) -> int:
        """Days before submitted reviews are auto-accepted"""
        return settings.SCHEDULER_AUTO_ACCEPT_DAYS

    @property
    def DISPUTE_WINDOW_DAYS(self) -> int:
        """Days reviewers have to dispute rejections"""
        return settings.SCHEDULER_DISPUTE_WINDOW_DAYS

    @property
    def SCHEDULER_INTERVAL_MINUTES(self) -> int:
        """How often scheduler jobs run (in minutes)"""
        return settings.SCHEDULER_INTERVAL_MINUTES

    @property
    def SCHEDULER_ENABLED(self) -> bool:
        """Enable/disable scheduler"""
        return settings.SCHEDULER_ENABLED


scheduler_settings = SchedulerSettings()
