"""
Base repository pattern for consistent database operations.

This module provides a generic base repository class that standardizes
common CRUD operations across all repositories, reducing code duplication
and ensuring consistent error handling.

Usage:
    from app.crud.base import BaseRepository
    from app.models.user import User

    class UserRepository(BaseRepository[User]):
        model = User
"""

import logging
from typing import Any, Dict, Generic, List, Optional, Tuple, Type, TypeVar, Union
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.core.exceptions import NotFoundError, DatabaseError

logger = logging.getLogger(__name__)

# Type variable for the model
ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """
    Generic base repository providing common CRUD operations.

    Attributes:
        model: The SQLAlchemy model class this repository manages

    Type Parameters:
        ModelType: The SQLAlchemy model type
    """

    model: Type[ModelType]

    def __init__(self, db: AsyncSession):
        """
        Initialize the repository with a database session.

        Args:
            db: Async SQLAlchemy session
        """
        self.db = db

    # =========================================================================
    # Basic CRUD Operations
    # =========================================================================

    async def get_by_id(
        self,
        id: Any,
        *,
        options: Optional[List] = None,
        with_deleted: bool = False
    ) -> Optional[ModelType]:
        """
        Get a single record by ID.

        Args:
            id: The primary key value
            options: SQLAlchemy loader options (selectinload, joinedload)
            with_deleted: Include soft-deleted records (if model has deleted_at)

        Returns:
            The model instance or None if not found
        """
        query = select(self.model).where(self.model.id == id)

        # Apply eager loading options
        if options:
            for option in options:
                query = query.options(option)

        # Filter out soft-deleted records
        if not with_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_id_or_raise(
        self,
        id: Any,
        *,
        resource_name: Optional[str] = None,
        options: Optional[List] = None,
        with_deleted: bool = False
    ) -> ModelType:
        """
        Get a single record by ID, raising NotFoundError if not found.

        Args:
            id: The primary key value
            resource_name: Name to use in error message (defaults to model name)
            options: SQLAlchemy loader options
            with_deleted: Include soft-deleted records

        Returns:
            The model instance

        Raises:
            NotFoundError: If record not found
        """
        instance = await self.get_by_id(id, options=options, with_deleted=with_deleted)
        if instance is None:
            name = resource_name or self.model.__name__
            raise NotFoundError(resource=name, resource_id=id)
        return instance

    async def get_one(
        self,
        *,
        filters: Optional[List] = None,
        options: Optional[List] = None,
        with_deleted: bool = False
    ) -> Optional[ModelType]:
        """
        Get a single record matching the given filters.

        Args:
            filters: List of SQLAlchemy filter conditions
            options: SQLAlchemy loader options
            with_deleted: Include soft-deleted records

        Returns:
            The model instance or None if not found
        """
        query = select(self.model)

        if filters:
            query = query.where(and_(*filters))

        if options:
            for option in options:
                query = query.options(option)

        if not with_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        *,
        filters: Optional[List] = None,
        options: Optional[List] = None,
        order_by: Optional[List] = None,
        with_deleted: bool = False
    ) -> List[ModelType]:
        """
        Get all records matching the given filters.

        Args:
            filters: List of SQLAlchemy filter conditions
            options: SQLAlchemy loader options
            order_by: List of order_by clauses
            with_deleted: Include soft-deleted records

        Returns:
            List of model instances
        """
        query = select(self.model)

        if filters:
            query = query.where(and_(*filters))

        if options:
            for option in options:
                query = query.options(option)

        if not with_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))

        if order_by:
            query = query.order_by(*order_by)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_paginated(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        filters: Optional[List] = None,
        options: Optional[List] = None,
        order_by: Optional[List] = None,
        with_deleted: bool = False
    ) -> Tuple[List[ModelType], int]:
        """
        Get paginated records with total count.

        Args:
            page: Page number (1-indexed)
            page_size: Number of records per page
            filters: List of SQLAlchemy filter conditions
            options: SQLAlchemy loader options
            order_by: List of order_by clauses
            with_deleted: Include soft-deleted records

        Returns:
            Tuple of (list of model instances, total count)
        """
        # Build base query
        query = select(self.model)

        if filters:
            query = query.where(and_(*filters))

        if not with_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply options and ordering
        if options:
            for option in options:
                query = query.options(option)

        if order_by:
            query = query.order_by(*order_by)

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def create(
        self,
        *,
        data: Dict[str, Any],
        commit: bool = True
    ) -> ModelType:
        """
        Create a new record.

        Args:
            data: Dictionary of field values
            commit: Whether to commit the transaction

        Returns:
            The created model instance
        """
        instance = self.model(**data)
        self.db.add(instance)

        if commit:
            await self.db.commit()
            await self.db.refresh(instance)

        return instance

    async def create_many(
        self,
        *,
        items: List[Dict[str, Any]],
        commit: bool = True
    ) -> List[ModelType]:
        """
        Create multiple records.

        Args:
            items: List of dictionaries with field values
            commit: Whether to commit the transaction

        Returns:
            List of created model instances
        """
        instances = [self.model(**data) for data in items]
        self.db.add_all(instances)

        if commit:
            await self.db.commit()
            for instance in instances:
                await self.db.refresh(instance)

        return instances

    async def update(
        self,
        instance: ModelType,
        *,
        data: Dict[str, Any],
        commit: bool = True
    ) -> ModelType:
        """
        Update an existing record.

        Args:
            instance: The model instance to update
            data: Dictionary of field values to update
            commit: Whether to commit the transaction

        Returns:
            The updated model instance
        """
        for field, value in data.items():
            if hasattr(instance, field):
                setattr(instance, field, value)

        if commit:
            await self.db.commit()
            await self.db.refresh(instance)

        return instance

    async def update_by_id(
        self,
        id: Any,
        *,
        data: Dict[str, Any],
        commit: bool = True
    ) -> Optional[ModelType]:
        """
        Update a record by ID.

        Args:
            id: The primary key value
            data: Dictionary of field values to update
            commit: Whether to commit the transaction

        Returns:
            The updated model instance or None if not found
        """
        instance = await self.get_by_id(id)
        if instance is None:
            return None

        return await self.update(instance, data=data, commit=commit)

    async def delete(
        self,
        instance: ModelType,
        *,
        soft: bool = True,
        commit: bool = True
    ) -> bool:
        """
        Delete a record (soft or hard delete).

        Args:
            instance: The model instance to delete
            soft: If True, soft delete (set deleted_at). If False, hard delete
            commit: Whether to commit the transaction

        Returns:
            True if deleted successfully
        """
        from datetime import datetime

        if soft and hasattr(instance, 'deleted_at'):
            instance.deleted_at = datetime.utcnow()
        else:
            await self.db.delete(instance)

        if commit:
            await self.db.commit()

        return True

    async def delete_by_id(
        self,
        id: Any,
        *,
        soft: bool = True,
        commit: bool = True
    ) -> bool:
        """
        Delete a record by ID.

        Args:
            id: The primary key value
            soft: If True, soft delete. If False, hard delete
            commit: Whether to commit the transaction

        Returns:
            True if deleted, False if not found
        """
        instance = await self.get_by_id(id)
        if instance is None:
            return False

        return await self.delete(instance, soft=soft, commit=commit)

    # =========================================================================
    # Utility Methods
    # =========================================================================

    async def exists(
        self,
        *,
        filters: Optional[List] = None,
        with_deleted: bool = False
    ) -> bool:
        """
        Check if any records exist matching the given filters.

        Args:
            filters: List of SQLAlchemy filter conditions
            with_deleted: Include soft-deleted records

        Returns:
            True if at least one record exists
        """
        query = select(func.count()).select_from(self.model)

        if filters:
            query = query.where(and_(*filters))

        if not with_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))

        result = await self.db.execute(query)
        count = result.scalar() or 0
        return count > 0

    async def count(
        self,
        *,
        filters: Optional[List] = None,
        with_deleted: bool = False
    ) -> int:
        """
        Count records matching the given filters.

        Args:
            filters: List of SQLAlchemy filter conditions
            with_deleted: Include soft-deleted records

        Returns:
            Number of matching records
        """
        query = select(func.count()).select_from(self.model)

        if filters:
            query = query.where(and_(*filters))

        if not with_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))

        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_with_lock(
        self,
        id: Any,
        *,
        options: Optional[List] = None
    ) -> Optional[ModelType]:
        """
        Get a record with row-level lock (FOR UPDATE).
        Use this for operations that need to prevent concurrent modifications.

        Args:
            id: The primary key value
            options: SQLAlchemy loader options

        Returns:
            The model instance or None if not found
        """
        query = select(self.model).where(self.model.id == id).with_for_update()

        if options:
            for option in options:
                query = query.options(option)

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def refresh(self, instance: ModelType) -> ModelType:
        """
        Refresh an instance from the database.

        Args:
            instance: The model instance to refresh

        Returns:
            The refreshed instance
        """
        await self.db.refresh(instance)
        return instance

    async def commit(self) -> None:
        """Commit the current transaction."""
        await self.db.commit()

    async def rollback(self) -> None:
        """Rollback the current transaction."""
        await self.db.rollback()
