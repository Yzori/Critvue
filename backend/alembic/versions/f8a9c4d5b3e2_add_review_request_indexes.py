"""add review request indexes for performance optimization

Revision ID: f8a9c4d5b3e2
Revises: a3f4d7e8c1b2
Create Date: 2025-11-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8a9c4d5b3e2'
down_revision: Union[str, None] = 'a3f4d7e8c1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add composite indexes to review_requests table for query optimization.
    These indexes improve performance for common query patterns:
    - User's reviews filtered by status and sorted by date
    - Non-deleted reviews by user
    - Reviews filtered by status and sorted by date (admin queries)
    """
    # Index for filtering user's reviews by status and sorting by date
    op.create_index(
        'idx_user_status_created',
        'review_requests',
        ['user_id', 'status', 'created_at'],
        unique=False
    )

    # Index for filtering non-deleted reviews by user
    op.create_index(
        'idx_user_deleted',
        'review_requests',
        ['user_id', 'deleted_at'],
        unique=False
    )

    # Index for filtering by status and date (for admin queries)
    op.create_index(
        'idx_status_created',
        'review_requests',
        ['status', 'created_at'],
        unique=False
    )


def downgrade() -> None:
    """Remove the composite indexes."""
    op.drop_index('idx_status_created', table_name='review_requests')
    op.drop_index('idx_user_deleted', table_name='review_requests')
    op.drop_index('idx_user_status_created', table_name='review_requests')
