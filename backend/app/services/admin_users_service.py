"""Admin User Management Service"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, List
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole, UserTier
from app.models.admin_audit_log import AdminAuditLog, AdminAction
from app.models.expert_application import ExpertApplication, ApplicationStatus
from app.models.challenge import Challenge, ChallengeStatus
from app.models.review_slot import ReviewSlot

logger = logging.getLogger(__name__)


class AdminUsersService:
    """Service for admin user management operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_users(
        self,
        query: Optional[str] = None,
        role: Optional[UserRole] = None,
        tier: Optional[UserTier] = None,
        is_banned: Optional[bool] = None,
        is_suspended: Optional[bool] = None,
        is_verified: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[User], int]:
        """Get paginated list of users with filters"""
        stmt = select(User)
        count_stmt = select(func.count(User.id))

        # Apply filters
        conditions = []

        if query:
            search = f"%{query}%"
            conditions.append(
                or_(
                    User.email.ilike(search),
                    User.full_name.ilike(search),
                )
            )

        if role:
            conditions.append(User.role == role)

        if tier:
            conditions.append(User.user_tier == tier)

        if is_banned is not None:
            conditions.append(User.is_banned == is_banned)

        if is_suspended is not None:
            conditions.append(User.is_suspended == is_suspended)

        if is_verified is not None:
            conditions.append(User.is_verified == is_verified)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        # Get total count
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Apply sorting with whitelist to prevent SQL injection
        ALLOWED_SORT_FIELDS = {
            "created_at": User.created_at,
            "email": User.email,
            "full_name": User.full_name,
            "role": User.role,
            "karma_points": User.karma_points,
            "last_login": User.last_login,
            "user_tier": User.user_tier,
        }
        sort_column = ALLOWED_SORT_FIELDS.get(sort_by, User.created_at)
        if sort_order.lower() == "asc":
            stmt = stmt.order_by(asc(sort_column))
        else:
            stmt = stmt.order_by(desc(sort_column))

        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        result = await self.db.execute(stmt)
        users = result.scalars().all()

        return list(users), total

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def change_user_role(
        self,
        user_id: int,
        new_role: UserRole,
        admin: User,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> User:
        """Change a user's role"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Prevent admin self-demotion (could lock themselves out)
        if user.id == admin.id and user.role == UserRole.ADMIN and new_role != UserRole.ADMIN:
            raise ValueError("Cannot demote yourself from admin role")

        old_role = user.role
        user.role = new_role
        user.updated_at = datetime.utcnow()

        # Log the action
        await self._log_action(
            admin=admin,
            action=AdminAction.USER_ROLE_CHANGE,
            target_user=user,
            details={
                "old_role": old_role.value,
                "new_role": new_role.value,
                "reason": reason,
            },
            ip_address=ip_address,
        )

        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User {user_id} role changed from {old_role} to {new_role} by admin {admin.id}")
        return user

    async def ban_user(
        self,
        user_id: int,
        reason: str,
        admin: User,
        ip_address: Optional[str] = None,
    ) -> User:
        """Ban a user"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if user.id == admin.id:
            raise ValueError("Cannot ban yourself")

        if user.role == UserRole.ADMIN:
            raise ValueError("Cannot ban another admin")

        if user.is_banned:
            raise ValueError("User is already banned")

        user.is_banned = True
        user.banned_at = datetime.utcnow()
        user.banned_by_id = admin.id
        user.ban_reason = reason
        user.updated_at = datetime.utcnow()

        # Also clear any active suspension
        user.is_suspended = False
        user.suspended_until = None
        user.suspended_at = None
        user.suspended_by_id = None
        user.suspension_reason = None

        # Log the action
        await self._log_action(
            admin=admin,
            action=AdminAction.USER_BAN,
            target_user=user,
            details={"reason": reason},
            ip_address=ip_address,
        )

        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User {user_id} banned by admin {admin.id}: {reason}")
        return user

    async def unban_user(
        self,
        user_id: int,
        admin: User,
        ip_address: Optional[str] = None,
    ) -> User:
        """Unban a user"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if not user.is_banned:
            raise ValueError("User is not banned")

        old_reason = user.ban_reason
        user.is_banned = False
        user.banned_at = None
        user.banned_by_id = None
        user.ban_reason = None
        user.updated_at = datetime.utcnow()

        # Log the action
        await self._log_action(
            admin=admin,
            action=AdminAction.USER_UNBAN,
            target_user=user,
            details={"previous_reason": old_reason},
            ip_address=ip_address,
        )

        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User {user_id} unbanned by admin {admin.id}")
        return user

    async def suspend_user(
        self,
        user_id: int,
        reason: str,
        duration_hours: int,
        admin: User,
        ip_address: Optional[str] = None,
    ) -> User:
        """Suspend a user temporarily"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if user.id == admin.id:
            raise ValueError("Cannot suspend yourself")

        if user.role == UserRole.ADMIN:
            raise ValueError("Cannot suspend another admin")

        if user.is_banned:
            raise ValueError("Cannot suspend a banned user")

        now = datetime.utcnow()
        user.is_suspended = True
        user.suspended_at = now
        user.suspended_until = now + timedelta(hours=duration_hours)
        user.suspended_by_id = admin.id
        user.suspension_reason = reason
        user.updated_at = now

        # Log the action
        await self._log_action(
            admin=admin,
            action=AdminAction.USER_SUSPEND,
            target_user=user,
            details={
                "reason": reason,
                "duration_hours": duration_hours,
                "until": user.suspended_until.isoformat(),
            },
            ip_address=ip_address,
        )

        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User {user_id} suspended for {duration_hours}h by admin {admin.id}: {reason}")
        return user

    async def unsuspend_user(
        self,
        user_id: int,
        admin: User,
        ip_address: Optional[str] = None,
    ) -> User:
        """Remove suspension from a user"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if not user.is_suspended:
            raise ValueError("User is not suspended")

        old_reason = user.suspension_reason
        old_until = user.suspended_until

        user.is_suspended = False
        user.suspended_at = None
        user.suspended_until = None
        user.suspended_by_id = None
        user.suspension_reason = None
        user.updated_at = datetime.utcnow()

        # Log the action
        await self._log_action(
            admin=admin,
            action=AdminAction.USER_UNSUSPEND,
            target_user=user,
            details={
                "previous_reason": old_reason,
                "was_until": old_until.isoformat() if old_until else None,
            },
            ip_address=ip_address,
        )

        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User {user_id} unsuspended by admin {admin.id}")
        return user

    async def verify_user(
        self,
        user_id: int,
        admin: User,
        ip_address: Optional[str] = None,
    ) -> User:
        """Manually verify a user's email"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if user.is_verified:
            raise ValueError("User is already verified")

        user.is_verified = True
        user.updated_at = datetime.utcnow()

        # Log the action
        await self._log_action(
            admin=admin,
            action=AdminAction.USER_VERIFY,
            target_user=user,
            details={},
            ip_address=ip_address,
        )

        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User {user_id} verified by admin {admin.id}")
        return user

    async def adjust_karma(
        self,
        user_id: int,
        amount: int,
        reason: str,
        admin: User,
        ip_address: Optional[str] = None,
    ) -> User:
        """Adjust a user's karma points"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        old_karma = user.karma_points
        user.karma_points = max(0, user.karma_points + amount)  # Prevent negative karma
        user.updated_at = datetime.utcnow()

        # Log the action
        await self._log_action(
            admin=admin,
            action=AdminAction.KARMA_ADJUST,
            target_user=user,
            details={
                "old_karma": old_karma,
                "new_karma": user.karma_points,
                "amount": amount,
                "reason": reason,
            },
            ip_address=ip_address,
        )

        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User {user_id} karma adjusted by {amount} by admin {admin.id}: {reason}")
        return user

    async def override_tier(
        self,
        user_id: int,
        new_tier: UserTier,
        admin: User,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> User:
        """Override a user's tier"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        old_tier = user.user_tier
        user.user_tier = new_tier
        user.tier_achieved_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()

        # Log the action
        await self._log_action(
            admin=admin,
            action=AdminAction.TIER_OVERRIDE,
            target_user=user,
            details={
                "old_tier": old_tier.value,
                "new_tier": new_tier.value,
                "reason": reason,
            },
            ip_address=ip_address,
        )

        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User {user_id} tier overridden to {new_tier} by admin {admin.id}")
        return user

    async def get_banned_users(self) -> List[User]:
        """Get all banned users"""
        stmt = select(User).where(User.is_banned == True).order_by(desc(User.banned_at))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_suspended_users(self) -> List[User]:
        """Get all suspended users (including expired suspensions that haven't been cleared)"""
        stmt = select(User).where(User.is_suspended == True).order_by(desc(User.suspended_at))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_audit_log(
        self,
        admin_id: Optional[int] = None,
        target_user_id: Optional[int] = None,
        action: Optional[AdminAction] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[dict], int]:
        """Get audit log entries with optional filters"""
        stmt = select(AdminAuditLog)
        count_stmt = select(func.count(AdminAuditLog.id))

        conditions = []
        if admin_id:
            conditions.append(AdminAuditLog.admin_id == admin_id)
        if target_user_id:
            conditions.append(AdminAuditLog.target_user_id == target_user_id)
        if action:
            conditions.append(AdminAuditLog.action == action)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        # Get total count
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Apply ordering and pagination
        stmt = stmt.order_by(desc(AdminAuditLog.created_at))
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        result = await self.db.execute(stmt)
        entries = result.scalars().all()

        # Fetch related user info
        log_entries = []
        for entry in entries:
            admin_user = await self.get_user_by_id(entry.admin_id)
            target_user = await self.get_user_by_id(entry.target_user_id) if entry.target_user_id else None

            log_entries.append({
                "id": entry.id,
                "admin_id": entry.admin_id,
                "admin_email": admin_user.email if admin_user else None,
                "admin_name": admin_user.full_name if admin_user else None,
                "action": entry.action.value if hasattr(entry.action, 'value') else entry.action,
                "target_user_id": entry.target_user_id,
                "target_user_email": target_user.email if target_user else None,
                "target_entity_type": entry.target_entity_type,
                "target_entity_id": entry.target_entity_id,
                "details": entry.details,
                "ip_address": entry.ip_address,
                "created_at": entry.created_at,
            })

        return log_entries, total

    async def get_admin_stats(self) -> dict:
        """Get admin dashboard statistics"""
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Total users
        total_users_result = await self.db.execute(select(func.count(User.id)))
        total_users = total_users_result.scalar() or 0

        # New users this week
        new_users_result = await self.db.execute(
            select(func.count(User.id)).where(User.created_at >= week_ago)
        )
        new_users_this_week = new_users_result.scalar() or 0

        # Active users today
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        active_today_result = await self.db.execute(
            select(func.count(User.id)).where(User.last_login >= today_start)
        )
        active_users_today = active_today_result.scalar() or 0

        # Reviewers count
        reviewers_result = await self.db.execute(
            select(func.count(User.id)).where(User.role == UserRole.REVIEWER)
        )
        total_reviewers = reviewers_result.scalar() or 0

        # Admins count
        admins_result = await self.db.execute(
            select(func.count(User.id)).where(User.role == UserRole.ADMIN)
        )
        total_admins = admins_result.scalar() or 0

        # Banned users
        banned_result = await self.db.execute(
            select(func.count(User.id)).where(User.is_banned == True)
        )
        banned_users = banned_result.scalar() or 0

        # Suspended users
        suspended_result = await self.db.execute(
            select(func.count(User.id)).where(User.is_suspended == True)
        )
        suspended_users = suspended_result.scalar() or 0

        # Pending applications (submitted or under review)
        pending_result = await self.db.execute(
            select(func.count(ExpertApplication.id)).where(
                ExpertApplication.status.in_([
                    ApplicationStatus.SUBMITTED,
                    ApplicationStatus.UNDER_REVIEW,
                    ApplicationStatus.RESUBMITTED
                ])
            )
        )
        pending_applications = pending_result.scalar() or 0

        # Approved this month
        approved_result = await self.db.execute(
            select(func.count(ExpertApplication.id)).where(
                and_(
                    ExpertApplication.status == ApplicationStatus.APPROVED,
                    ExpertApplication.updated_at >= month_start
                )
            )
        )
        approved_this_month = approved_result.scalar() or 0

        # Rejected this month
        rejected_result = await self.db.execute(
            select(func.count(ExpertApplication.id)).where(
                and_(
                    ExpertApplication.status == ApplicationStatus.REJECTED,
                    ExpertApplication.updated_at >= month_start
                )
            )
        )
        rejected_this_month = rejected_result.scalar() or 0

        # Active challenges
        active_challenges_result = await self.db.execute(
            select(func.count(Challenge.id)).where(
                Challenge.status.in_([ChallengeStatus.ACTIVE, ChallengeStatus.OPEN, ChallengeStatus.VOTING])
            )
        )
        active_challenges = active_challenges_result.scalar() or 0

        # Total completed reviews
        total_reviews_result = await self.db.execute(
            select(func.count(ReviewSlot.id)).where(ReviewSlot.status == 'completed')
        )
        total_reviews = total_reviews_result.scalar() or 0

        return {
            "total_users": total_users,
            "new_users_this_week": new_users_this_week,
            "active_users_today": active_users_today,
            "total_reviewers": total_reviewers,
            "total_admins": total_admins,
            "banned_users": banned_users,
            "suspended_users": suspended_users,
            "pending_applications": pending_applications,
            "approved_this_month": approved_this_month,
            "rejected_this_month": rejected_this_month,
            "active_challenges": active_challenges,
            "total_reviews": total_reviews,
            "avg_review_time_days": 2.5,  # TODO: Calculate actual average
        }

    async def _log_action(
        self,
        admin: User,
        action: AdminAction,
        target_user: Optional[User] = None,
        target_entity_type: Optional[str] = None,
        target_entity_id: Optional[int] = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AdminAuditLog:
        """Log an admin action to the audit log"""
        log_entry = AdminAuditLog(
            admin_id=admin.id,
            action=action,
            target_user_id=target_user.id if target_user else None,
            target_entity_type=target_entity_type,
            target_entity_id=target_entity_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(log_entry)
        return log_entry
