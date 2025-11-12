"""CRUD operations for portfolio items"""

from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Portfolio
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate


async def create_portfolio_item(
    db: AsyncSession, user_id: int, portfolio_data: PortfolioCreate
) -> Portfolio:
    """
    Create a new portfolio item

    Args:
        db: Database session
        user_id: User ID
        portfolio_data: Portfolio creation data

    Returns:
        Created portfolio item
    """
    portfolio_dict = portfolio_data.model_dump()

    # Convert is_featured boolean to integer for SQLite
    portfolio_dict["is_featured"] = 1 if portfolio_dict.get("is_featured") else 0

    portfolio = Portfolio(
        user_id=user_id,
        **portfolio_dict,
    )

    db.add(portfolio)
    await db.commit()
    await db.refresh(portfolio)

    return portfolio


async def get_portfolio_item(
    db: AsyncSession, portfolio_id: int, user_id: Optional[int] = None
) -> Optional[Portfolio]:
    """
    Get a portfolio item by ID

    Args:
        db: Database session
        portfolio_id: Portfolio item ID
        user_id: Optional user ID to verify ownership

    Returns:
        Portfolio item or None if not found
    """
    query = select(Portfolio).where(Portfolio.id == portfolio_id)

    if user_id is not None:
        query = query.where(Portfolio.user_id == user_id)

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_user_portfolio_items(
    db: AsyncSession,
    user_id: int,
    content_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[Portfolio], int]:
    """
    Get portfolio items for a user with pagination

    Args:
        db: Database session
        user_id: User ID
        content_type: Optional content type filter
        skip: Number of items to skip
        limit: Maximum number of items to return

    Returns:
        Tuple of (list of portfolio items, total count)
    """
    # Build query
    query = select(Portfolio).where(Portfolio.user_id == user_id)

    if content_type:
        query = query.where(Portfolio.content_type == content_type)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated items (ordered by featured first, then by creation date)
    query = (
        query.order_by(desc(Portfolio.is_featured), desc(Portfolio.created_at))
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    items = result.scalars().all()

    return list(items), total


async def update_portfolio_item(
    db: AsyncSession,
    portfolio_id: int,
    user_id: int,
    portfolio_data: PortfolioUpdate,
) -> Optional[Portfolio]:
    """
    Update a portfolio item

    Args:
        db: Database session
        portfolio_id: Portfolio item ID
        user_id: User ID (for ownership verification)
        portfolio_data: Portfolio update data

    Returns:
        Updated portfolio item or None if not found or not owned by user
    """
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id, Portfolio.user_id == user_id
        )
    )
    portfolio = result.scalar_one_or_none()

    if not portfolio:
        return None

    # Update fields if provided
    update_data = portfolio_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "is_featured" and value is not None:
            # Convert boolean to integer for SQLite
            setattr(portfolio, field, 1 if value else 0)
        else:
            setattr(portfolio, field, value)

    portfolio.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(portfolio)

    return portfolio


async def delete_portfolio_item(
    db: AsyncSession, portfolio_id: int, user_id: int
) -> bool:
    """
    Delete a portfolio item

    Args:
        db: Database session
        portfolio_id: Portfolio item ID
        user_id: User ID (for ownership verification)

    Returns:
        True if deleted, False if not found or not owned by user
    """
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id, Portfolio.user_id == user_id
        )
    )
    portfolio = result.scalar_one_or_none()

    if not portfolio:
        return False

    await db.delete(portfolio)
    await db.commit()

    return True


async def increment_portfolio_views(
    db: AsyncSession, portfolio_id: int
) -> Optional[Portfolio]:
    """
    Increment view count for a portfolio item

    Args:
        db: Database session
        portfolio_id: Portfolio item ID

    Returns:
        Updated portfolio item or None if not found
    """
    result = await db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
    portfolio = result.scalar_one_or_none()

    if not portfolio:
        return None

    portfolio.views_count += 1
    portfolio.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(portfolio)

    return portfolio


async def get_featured_portfolio_items(
    db: AsyncSession, limit: int = 10
) -> List[Portfolio]:
    """
    Get featured portfolio items across all users

    Args:
        db: Database session
        limit: Maximum number of items to return

    Returns:
        List of featured portfolio items
    """
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.is_featured == 1)
        .order_by(desc(Portfolio.created_at))
        .limit(limit)
    )

    return list(result.scalars().all())
