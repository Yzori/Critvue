"""
Query helpers for consistent sorting, filtering, and query building.

This module provides utilities for dynamic query construction,
standardized sorting, and filter application.

Usage:
    from app.utils.query_helpers import SortParams, apply_sorting, QueryBuilder

    @router.get("/items")
    async def list_items(
        sort: SortParams = Depends(get_sort_params(["created_at", "name"]))
    ):
        query = apply_sorting(select(Item), sort, Item)
        ...
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Type, Union, Callable
from datetime import datetime

from fastapi import Query, HTTPException
from sqlalchemy import select, and_, or_, func, desc, asc
from sqlalchemy.sql import Select
from sqlalchemy.orm import InstrumentedAttribute


# =============================================================================
# Sort Direction Enum
# =============================================================================

class SortDirection(str, Enum):
    """Sort direction for query ordering."""
    ASC = "asc"
    DESC = "desc"


# =============================================================================
# Sort Parameters
# =============================================================================

@dataclass
class SortParams:
    """
    Sorting parameters for queries.

    Attributes:
        field: Field name to sort by
        direction: Sort direction (asc/desc)
        allowed_fields: List of fields that can be sorted
    """
    field: str
    direction: SortDirection
    allowed_fields: List[str] = field(default_factory=list)

    def validate(self) -> None:
        """Validate that the sort field is allowed."""
        if self.allowed_fields and self.field not in self.allowed_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sort field '{self.field}'. Allowed fields: {self.allowed_fields}"
            )


def get_sort_params(
    allowed_fields: List[str],
    default_field: str = "created_at",
    default_direction: SortDirection = SortDirection.DESC
) -> Callable:
    """
    Create a FastAPI dependency for sort parameters.

    Args:
        allowed_fields: List of field names that can be sorted
        default_field: Default sort field
        default_direction: Default sort direction

    Returns:
        FastAPI dependency function

    Usage:
        @router.get("/items")
        async def list_items(
            sort: SortParams = Depends(get_sort_params(["created_at", "name", "status"]))
        ):
            ...
    """
    def dependency(
        sort_by: str = Query(default_field, description=f"Field to sort by. Allowed: {allowed_fields}"),
        sort_dir: SortDirection = Query(default_direction, description="Sort direction")
    ) -> SortParams:
        params = SortParams(
            field=sort_by,
            direction=sort_dir,
            allowed_fields=allowed_fields
        )
        params.validate()
        return params

    return dependency


def apply_sorting(
    query: Select,
    params: SortParams,
    model: Type[Any]
) -> Select:
    """
    Apply sorting to a SQLAlchemy query.

    Args:
        query: SQLAlchemy select query
        params: Sort parameters
        model: SQLAlchemy model class

    Returns:
        Query with ordering applied
    """
    # Get the column from the model
    column = getattr(model, params.field, None)
    if column is None:
        return query

    # Apply sort direction
    if params.direction == SortDirection.DESC:
        return query.order_by(desc(column))
    return query.order_by(asc(column))


# =============================================================================
# Filter Helpers
# =============================================================================

@dataclass
class FilterCondition:
    """Represents a single filter condition."""
    field: str
    operator: str  # eq, ne, gt, gte, lt, lte, like, ilike, in, not_in, is_null, is_not_null
    value: Any


def build_filter_condition(
    model: Type[Any],
    condition: FilterCondition
) -> Optional[Any]:
    """
    Build a SQLAlchemy filter condition from a FilterCondition.

    Args:
        model: SQLAlchemy model class
        condition: Filter condition specification

    Returns:
        SQLAlchemy filter expression or None
    """
    column = getattr(model, condition.field, None)
    if column is None:
        return None

    operators = {
        "eq": lambda c, v: c == v,
        "ne": lambda c, v: c != v,
        "gt": lambda c, v: c > v,
        "gte": lambda c, v: c >= v,
        "lt": lambda c, v: c < v,
        "lte": lambda c, v: c <= v,
        "like": lambda c, v: c.like(f"%{v}%"),
        "ilike": lambda c, v: c.ilike(f"%{v}%"),
        "in": lambda c, v: c.in_(v) if isinstance(v, (list, tuple)) else c == v,
        "not_in": lambda c, v: ~c.in_(v) if isinstance(v, (list, tuple)) else c != v,
        "is_null": lambda c, v: c.is_(None),
        "is_not_null": lambda c, v: c.is_not(None),
    }

    op_func = operators.get(condition.operator)
    if op_func is None:
        return None

    return op_func(column, condition.value)


def apply_filters(
    query: Select,
    model: Type[Any],
    conditions: List[FilterCondition],
    *,
    combine_with: str = "and"
) -> Select:
    """
    Apply multiple filter conditions to a query.

    Args:
        query: SQLAlchemy select query
        model: SQLAlchemy model class
        conditions: List of filter conditions
        combine_with: How to combine conditions ("and" or "or")

    Returns:
        Query with filters applied
    """
    filter_expressions = []
    for condition in conditions:
        expr = build_filter_condition(model, condition)
        if expr is not None:
            filter_expressions.append(expr)

    if not filter_expressions:
        return query

    if combine_with == "or":
        return query.where(or_(*filter_expressions))
    return query.where(and_(*filter_expressions))


# =============================================================================
# Query Builder (Fluent API)
# =============================================================================

class QueryBuilder:
    """
    Fluent query builder for constructing complex queries.

    Usage:
        query = (
            QueryBuilder(User)
            .filter(User.is_active == True)
            .filter_if(status, User.status == status)
            .search(search_term, [User.name, User.email])
            .sort("created_at", "desc")
            .paginate(page=1, page_size=20)
            .build()
        )
    """

    def __init__(self, model: Type[Any], *, base_query: Optional[Select] = None):
        """
        Initialize the query builder.

        Args:
            model: SQLAlchemy model class
            base_query: Optional base query to start from
        """
        self.model = model
        self._query = base_query if base_query is not None else select(model)
        self._filters: List[Any] = []
        self._order_by: List[Any] = []
        self._offset: Optional[int] = None
        self._limit: Optional[int] = None

    def filter(self, *conditions) -> "QueryBuilder":
        """
        Add filter conditions (always applied).

        Args:
            *conditions: SQLAlchemy filter expressions

        Returns:
            Self for chaining
        """
        self._filters.extend(conditions)
        return self

    def filter_if(self, value: Any, condition: Any) -> "QueryBuilder":
        """
        Add a filter condition only if value is truthy.

        Args:
            value: Value to check
            condition: SQLAlchemy filter expression to add if value is truthy

        Returns:
            Self for chaining
        """
        if value:
            self._filters.append(condition)
        return self

    def filter_in(self, column: InstrumentedAttribute, values: List[Any]) -> "QueryBuilder":
        """
        Add an IN filter for a list of values.

        Args:
            column: Model column
            values: List of values to match

        Returns:
            Self for chaining
        """
        if values:
            self._filters.append(column.in_(values))
        return self

    def search(
        self,
        term: Optional[str],
        columns: List[InstrumentedAttribute],
        *,
        case_insensitive: bool = True
    ) -> "QueryBuilder":
        """
        Add a search filter across multiple columns.

        Args:
            term: Search term
            columns: List of model columns to search
            case_insensitive: Use case-insensitive search

        Returns:
            Self for chaining
        """
        if not term or not columns:
            return self

        search_conditions = []
        pattern = f"%{term}%"

        for column in columns:
            if case_insensitive:
                search_conditions.append(column.ilike(pattern))
            else:
                search_conditions.append(column.like(pattern))

        if search_conditions:
            self._filters.append(or_(*search_conditions))

        return self

    def exclude_deleted(self) -> "QueryBuilder":
        """
        Exclude soft-deleted records (assumes deleted_at column).

        Returns:
            Self for chaining
        """
        if hasattr(self.model, 'deleted_at'):
            self._filters.append(self.model.deleted_at.is_(None))
        return self

    def sort(
        self,
        field: str,
        direction: Union[str, SortDirection] = SortDirection.ASC
    ) -> "QueryBuilder":
        """
        Add sorting.

        Args:
            field: Field name to sort by
            direction: Sort direction ("asc" or "desc")

        Returns:
            Self for chaining
        """
        column = getattr(self.model, field, None)
        if column is None:
            return self

        if isinstance(direction, str):
            direction = SortDirection(direction.lower())

        if direction == SortDirection.DESC:
            self._order_by.append(desc(column))
        else:
            self._order_by.append(asc(column))

        return self

    def sort_by_params(self, params: SortParams) -> "QueryBuilder":
        """
        Apply sorting from SortParams.

        Args:
            params: Sort parameters

        Returns:
            Self for chaining
        """
        return self.sort(params.field, params.direction)

    def paginate(self, page: int = 1, page_size: int = 20) -> "QueryBuilder":
        """
        Add pagination.

        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Self for chaining
        """
        self._offset = (page - 1) * page_size
        self._limit = page_size
        return self

    def with_options(self, *options) -> "QueryBuilder":
        """
        Add SQLAlchemy query options (e.g., selectinload).

        Args:
            *options: SQLAlchemy query options

        Returns:
            Self for chaining
        """
        for option in options:
            self._query = self._query.options(option)
        return self

    def build(self) -> Select:
        """
        Build and return the final query.

        Returns:
            Constructed SQLAlchemy select query
        """
        query = self._query

        # Apply filters
        if self._filters:
            query = query.where(and_(*self._filters))

        # Apply ordering
        if self._order_by:
            query = query.order_by(*self._order_by)

        # Apply pagination
        if self._offset is not None:
            query = query.offset(self._offset)
        if self._limit is not None:
            query = query.limit(self._limit)

        return query

    def build_count_query(self) -> Select:
        """
        Build a count query (without pagination/ordering).

        Returns:
            Count query
        """
        base_query = self._query
        if self._filters:
            base_query = base_query.where(and_(*self._filters))

        return select(func.count()).select_from(base_query.subquery())


# =============================================================================
# Date Range Filter Helper
# =============================================================================

def date_range_filter(
    column: InstrumentedAttribute,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Any]:
    """
    Create date range filter conditions.

    Args:
        column: DateTime column to filter
        start_date: Start of date range (inclusive)
        end_date: End of date range (inclusive)

    Returns:
        List of filter conditions
    """
    conditions = []

    if start_date:
        conditions.append(column >= start_date)
    if end_date:
        conditions.append(column <= end_date)

    return conditions


# =============================================================================
# Status Filter Helper
# =============================================================================

def status_filter(
    column: InstrumentedAttribute,
    statuses: Optional[Union[str, List[str]]] = None,
    *,
    exclude: bool = False
) -> Optional[Any]:
    """
    Create a status filter condition.

    Args:
        column: Status column to filter
        statuses: Single status or list of statuses
        exclude: If True, exclude these statuses instead of including

    Returns:
        Filter condition or None
    """
    if not statuses:
        return None

    if isinstance(statuses, str):
        statuses = [statuses]

    if exclude:
        return ~column.in_(statuses)
    return column.in_(statuses)
