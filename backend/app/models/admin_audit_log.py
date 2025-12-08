"""Admin Audit Log model for tracking administrative actions"""

import enum
from datetime import datetime
from sqlalchemy import Column, DateTime, Enum, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.models.user import Base


class AdminAction(str, enum.Enum):
    """Types of admin actions that can be logged"""
    # User management
    USER_ROLE_CHANGE = "user_role_change"
    USER_BAN = "user_ban"
    USER_UNBAN = "user_unban"
    USER_SUSPEND = "user_suspend"
    USER_UNSUSPEND = "user_unsuspend"
    USER_VERIFY = "user_verify"
    USER_PASSWORD_RESET = "user_password_reset"
    USER_EDIT = "user_edit"
    USER_FORCE_LOGOUT = "user_force_logout"

    # Sparks/tier management
    SPARKS_ADJUST = "sparks_adjust"
    KARMA_ADJUST = "sparks_adjust"  # Backward compatibility alias
    TIER_OVERRIDE = "tier_override"

    # Application management
    APPLICATION_CLAIM = "application_claim"
    APPLICATION_VOTE = "application_vote"
    APPLICATION_RELEASE = "application_release"

    # Committee management
    COMMITTEE_MEMBER_ADD = "committee_member_add"
    COMMITTEE_MEMBER_REMOVE = "committee_member_remove"
    COMMITTEE_MEMBER_UPDATE = "committee_member_update"

    # Challenge management
    CHALLENGE_CREATE = "challenge_create"
    CHALLENGE_UPDATE = "challenge_update"
    CHALLENGE_DELETE = "challenge_delete"
    CHALLENGE_STATUS_CHANGE = "challenge_status_change"

    # System
    SETTINGS_CHANGE = "settings_change"
    IMPERSONATION = "impersonation"


class AdminAuditLog(Base):
    """
    Audit log for tracking all administrative actions.

    Every admin action should be logged here for accountability,
    security, and debugging purposes.
    """

    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Who performed the action
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # What action was performed
    action = Column(
        Enum(AdminAction, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )

    # Target of the action (if applicable)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    target_entity_type = Column(String(50), nullable=True)  # e.g., "challenge", "application"
    target_entity_id = Column(Integer, nullable=True)

    # Details of the action
    details = Column(JSON, nullable=True)  # Action-specific data (old_value, new_value, reason, etc.)

    # Request context
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    admin = relationship("User", foreign_keys=[admin_id], backref="admin_actions")
    target_user = relationship("User", foreign_keys=[target_user_id], backref="admin_actions_received")

    def __repr__(self) -> str:
        return f"<AdminAuditLog {self.id}: {self.action} by admin {self.admin_id}>"
