"""Admin User Management API endpoints"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole, UserTier
from app.services.admin_users_service import AdminUsersService
from app.schemas.admin_users import (
    UserListResponse,
    UserListItem,
    UserDetailResponse,
    UserRoleChangeRequest,
    BanUserRequest,
    SuspendUserRequest,
    KarmaAdjustRequest,
    TierOverrideRequest,
    ModerationActionResponse,
    AdminStatsResponse,
    AuditLogResponse,
    AuditLogEntry,
    BannedUserListResponse,
    SuspendedUserListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


# ============ Dependencies ============

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to verify current user is an admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_client_ip(request: Request) -> Optional[str]:
    """Get client IP from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


# ============ User List & Search ============

@router.get("", response_model=UserListResponse)
async def list_users(
    query: Optional[str] = Query(None, description="Search in email, name"),
    role: Optional[UserRole] = Query(None),
    tier: Optional[UserTier] = Query(None),
    is_banned: Optional[bool] = Query(None),
    is_suspended: Optional[bool] = Query(None),
    is_verified: Optional[bool] = Query(None),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    List and search users with filtering and pagination.
    """
    service = AdminUsersService(db)
    users, total = await service.get_users(
        query=query,
        role=role,
        tier=tier,
        is_banned=is_banned,
        is_suspended=is_suspended,
        is_verified=is_verified,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size

    return UserListResponse(
        users=[UserListItem.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get admin dashboard statistics.
    """
    service = AdminUsersService(db)
    stats = await service.get_admin_stats()
    return AdminStatsResponse(**stats)


# ============ User Detail ============

@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information about a user.
    """
    service = AdminUsersService(db)
    user = await service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserDetailResponse.model_validate(user)


# ============ Role Management ============

@router.post("/{user_id}/role", response_model=ModerationActionResponse)
async def change_user_role(
    user_id: int,
    request_body: UserRoleChangeRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Change a user's role (creator, reviewer, admin).
    """
    service = AdminUsersService(db)

    try:
        await service.change_user_role(
            user_id=user_id,
            new_role=request_body.role,
            admin=admin,
            reason=request_body.reason,
            ip_address=get_client_ip(request),
        )
        return ModerationActionResponse(
            success=True,
            message=f"User role changed to {request_body.role.value}",
            user_id=user_id,
            action="role_change",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============ Ban Management ============

@router.post("/{user_id}/ban", response_model=ModerationActionResponse)
async def ban_user(
    user_id: int,
    request_body: BanUserRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Ban a user permanently.
    """
    service = AdminUsersService(db)

    try:
        await service.ban_user(
            user_id=user_id,
            reason=request_body.reason,
            admin=admin,
            ip_address=get_client_ip(request),
        )
        return ModerationActionResponse(
            success=True,
            message="User has been banned",
            user_id=user_id,
            action="ban",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{user_id}/unban", response_model=ModerationActionResponse)
async def unban_user(
    user_id: int,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove ban from a user.
    """
    service = AdminUsersService(db)

    try:
        await service.unban_user(
            user_id=user_id,
            admin=admin,
            ip_address=get_client_ip(request),
        )
        return ModerationActionResponse(
            success=True,
            message="User has been unbanned",
            user_id=user_id,
            action="unban",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============ Suspension Management ============

@router.post("/{user_id}/suspend", response_model=ModerationActionResponse)
async def suspend_user(
    user_id: int,
    request_body: SuspendUserRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Temporarily suspend a user.
    """
    service = AdminUsersService(db)

    try:
        user = await service.suspend_user(
            user_id=user_id,
            reason=request_body.reason,
            duration_hours=request_body.duration_hours,
            admin=admin,
            ip_address=get_client_ip(request),
        )
        return ModerationActionResponse(
            success=True,
            message=f"User suspended until {user.suspended_until.isoformat()}",
            user_id=user_id,
            action="suspend",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{user_id}/unsuspend", response_model=ModerationActionResponse)
async def unsuspend_user(
    user_id: int,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove suspension from a user.
    """
    service = AdminUsersService(db)

    try:
        await service.unsuspend_user(
            user_id=user_id,
            admin=admin,
            ip_address=get_client_ip(request),
        )
        return ModerationActionResponse(
            success=True,
            message="User suspension has been removed",
            user_id=user_id,
            action="unsuspend",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============ Verification ============

@router.post("/{user_id}/verify", response_model=ModerationActionResponse)
async def verify_user(
    user_id: int,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually verify a user's email.
    """
    service = AdminUsersService(db)

    try:
        await service.verify_user(
            user_id=user_id,
            admin=admin,
            ip_address=get_client_ip(request),
        )
        return ModerationActionResponse(
            success=True,
            message="User has been verified",
            user_id=user_id,
            action="verify",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============ Karma Management ============

@router.post("/{user_id}/karma", response_model=ModerationActionResponse)
async def adjust_karma(
    user_id: int,
    request_body: KarmaAdjustRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Adjust a user's karma points.
    """
    service = AdminUsersService(db)

    try:
        user = await service.adjust_karma(
            user_id=user_id,
            amount=request_body.amount,
            reason=request_body.reason,
            admin=admin,
            ip_address=get_client_ip(request),
        )
        return ModerationActionResponse(
            success=True,
            message=f"Karma adjusted. New karma: {user.karma_points}",
            user_id=user_id,
            action="karma_adjust",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============ Tier Management ============

@router.post("/{user_id}/tier", response_model=ModerationActionResponse)
async def override_tier(
    user_id: int,
    request_body: TierOverrideRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Override a user's tier.
    """
    service = AdminUsersService(db)

    try:
        await service.override_tier(
            user_id=user_id,
            new_tier=request_body.tier,
            admin=admin,
            reason=request_body.reason,
            ip_address=get_client_ip(request),
        )
        return ModerationActionResponse(
            success=True,
            message=f"User tier changed to {request_body.tier.value}",
            user_id=user_id,
            action="tier_override",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============ Moderation Lists ============

@router.get("/moderation/banned", response_model=BannedUserListResponse)
async def get_banned_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of all banned users.
    """
    service = AdminUsersService(db)
    users = await service.get_banned_users()

    return BannedUserListResponse(
        users=[UserListItem.model_validate(u) for u in users],
        total=len(users),
    )


@router.get("/moderation/suspended", response_model=SuspendedUserListResponse)
async def get_suspended_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of all suspended users.
    """
    service = AdminUsersService(db)
    users = await service.get_suspended_users()

    return SuspendedUserListResponse(
        users=[UserListItem.model_validate(u) for u in users],
        total=len(users),
    )


@router.get("/moderation/audit", response_model=AuditLogResponse)
async def get_audit_log(
    admin_id: Optional[int] = Query(None, description="Filter by admin who performed action"),
    target_user_id: Optional[int] = Query(None, description="Filter by target user"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get admin audit log entries.
    """
    service = AdminUsersService(db)
    entries, total = await service.get_audit_log(
        admin_id=admin_id,
        target_user_id=target_user_id,
        page=page,
        page_size=page_size,
    )

    return AuditLogResponse(
        entries=[AuditLogEntry(**e) for e in entries],
        total=total,
        page=page,
        page_size=page_size,
    )
