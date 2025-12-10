"""
Pagination utilities for consistent pagination handling across API endpoints.

This module provides helpers for pagination parameters, response building,
and cursor-based pagination support.

Usage:
    from app.utils.pagination import PaginationParams, paginate_query, PaginatedResponse

    @router.get("/items")
    async def list_items(
        pagination: PaginationParams = Depends()
    ):
        items, total = await paginate_query(query, pagination)
        return PaginatedResponse.create(items, total, pagination)
"""

from dataclasses import dataclass
from typing import Any, Generic, List, Optional, Tuple, TypeVar
from math import ceil

from fastapi import Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.constants.pagination import PaginationDefaults

T = TypeVar("T")


# =============================================================================
# Pagination Parameters
# =============================================================================

@dataclass
class PaginationParams:
    """
    Standard pagination parameters extracted from query strings.

    Usage as FastAPI dependency:
        @router.get("/items")
        async def list_items(pagination: PaginationParams = Depends()):
            ...
    """
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        """Calculate offset for SQL queries."""
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        """Alias for page_size for SQL queries."""
        return self.page_size


def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(
        PaginationDefaults.DESKTOP_PAGE_SIZE,
        ge=1,
        le=PaginationDefaults.DESKTOP_MAX_PAGE_SIZE,
        description="Number of items per page"
    )
) -> PaginationParams:
    """
    FastAPI dependency for extracting pagination parameters.

    Usage:
        @router.get("/items")
        async def list_items(
            pagination: PaginationParams = Depends(get_pagination_params)
        ):
            ...
    """
    return PaginationParams(page=page, page_size=page_size)


def get_mobile_pagination_params(
    page: int = Query(1, ge=1),
    page_size: int = Query(
        PaginationDefaults.MOBILE_PAGE_SIZE,
        ge=1,
        le=PaginationDefaults.MOBILE_MAX_PAGE_SIZE
    )
) -> PaginationParams:
    """Pagination parameters optimized for mobile clients."""
    return PaginationParams(page=page, page_size=page_size)


def get_admin_pagination_params(
    page: int = Query(1, ge=1),
    page_size: int = Query(
        PaginationDefaults.ADMIN_PAGE_SIZE,
        ge=1,
        le=PaginationDefaults.ADMIN_MAX_PAGE_SIZE
    )
) -> PaginationParams:
    """Pagination parameters for admin endpoints."""
    return PaginationParams(page=page, page_size=page_size)


# =============================================================================
# Paginated Response
# =============================================================================

class PaginationMeta(BaseModel):
    """Pagination metadata for response."""
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Standard paginated response wrapper.

    Usage:
        return PaginatedResponse.create(items, total, pagination)
    """
    items: List[Any]
    pagination: PaginationMeta

    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        params: PaginationParams
    ) -> "PaginatedResponse[T]":
        """
        Create a paginated response from items and parameters.

        Args:
            items: List of items for current page
            total: Total number of items across all pages
            params: Pagination parameters used for the query

        Returns:
            PaginatedResponse with items and metadata
        """
        total_pages = ceil(total / params.page_size) if params.page_size > 0 else 0

        return cls(
            items=items,
            pagination=PaginationMeta(
                page=params.page,
                page_size=params.page_size,
                total_items=total,
                total_pages=total_pages,
                has_next=params.page < total_pages,
                has_previous=params.page > 1
            )
        )


# =============================================================================
# Query Helpers
# =============================================================================

async def paginate_query(
    db: AsyncSession,
    query: Select,
    params: PaginationParams,
    *,
    count_query: Optional[Select] = None
) -> Tuple[List[Any], int]:
    """
    Execute a paginated query and return items with total count.

    Args:
        db: Database session
        query: SQLAlchemy select query (without pagination applied)
        params: Pagination parameters
        count_query: Optional custom count query (auto-generated if not provided)

    Returns:
        Tuple of (items, total_count)

    Usage:
        query = select(User).where(User.is_active == True)
        items, total = await paginate_query(db, query, pagination)
    """
    # Get total count
    if count_query is None:
        count_query = select(func.count()).select_from(query.subquery())

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and get items
    paginated_query = query.offset(params.offset).limit(params.limit)
    result = await db.execute(paginated_query)
    items = list(result.scalars().all())

    return items, total


async def get_paginated_response(
    db: AsyncSession,
    query: Select,
    params: PaginationParams,
    *,
    count_query: Optional[Select] = None,
    transform: Optional[callable] = None
) -> PaginatedResponse:
    """
    Execute paginated query and return a PaginatedResponse.

    Args:
        db: Database session
        query: SQLAlchemy select query
        params: Pagination parameters
        count_query: Optional custom count query
        transform: Optional function to transform each item

    Returns:
        PaginatedResponse with items and metadata
    """
    items, total = await paginate_query(db, query, params, count_query=count_query)

    if transform:
        items = [transform(item) for item in items]

    return PaginatedResponse.create(items, total, params)


# =============================================================================
# Offset/Limit Helpers (for backward compatibility)
# =============================================================================

def calculate_offset(page: int, page_size: int) -> int:
    """
    Calculate offset from page number and page size.

    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page

    Returns:
        Offset value for SQL query
    """
    return (max(1, page) - 1) * page_size


def calculate_total_pages(total_items: int, page_size: int) -> int:
    """
    Calculate total number of pages.

    Args:
        total_items: Total number of items
        page_size: Number of items per page

    Returns:
        Total number of pages
    """
    if page_size <= 0:
        return 0
    return ceil(total_items / page_size)


def build_pagination_meta(
    page: int,
    page_size: int,
    total_items: int
) -> dict:
    """
    Build pagination metadata dictionary.

    Args:
        page: Current page number
        page_size: Items per page
        total_items: Total number of items

    Returns:
        Dictionary with pagination metadata
    """
    total_pages = calculate_total_pages(total_items, page_size)

    return {
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }
