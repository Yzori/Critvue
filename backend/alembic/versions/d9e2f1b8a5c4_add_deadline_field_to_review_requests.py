"""Add deadline field to review_requests

Revision ID: d9e2f1b8a5c4
Revises: f8a9c4d5b3e2
Create Date: 2025-11-11 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9e2f1b8a5c4'
down_revision: Union[str, None] = 'f8a9c4d5b3e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add deadline column and indexes for browse marketplace"""

    # Add deadline column
    op.add_column(
        'review_requests',
        sa.Column('deadline', sa.DateTime(), nullable=True)
    )

    # Create index on deadline for filtering
    op.create_index(
        op.f('ix_review_requests_deadline'),
        'review_requests',
        ['deadline'],
        unique=False
    )

    # Create composite index for browse queries (status + deadline)
    op.create_index(
        'idx_status_deadline',
        'review_requests',
        ['status', 'deadline'],
        unique=False
    )

    # Create composite index for content type filtering (content_type + status + created_at)
    op.create_index(
        'idx_content_status',
        'review_requests',
        ['content_type', 'status', 'created_at'],
        unique=False
    )


def downgrade() -> None:
    """Remove deadline column and indexes"""

    # Drop composite indexes
    op.drop_index('idx_content_status', table_name='review_requests')
    op.drop_index('idx_status_deadline', table_name='review_requests')

    # Drop deadline index
    op.drop_index(op.f('ix_review_requests_deadline'), table_name='review_requests')

    # Drop deadline column
    op.drop_column('review_requests', 'deadline')
