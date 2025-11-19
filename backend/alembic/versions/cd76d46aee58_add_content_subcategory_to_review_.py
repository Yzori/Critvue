"""add_content_subcategory_to_review_requests

Revision ID: cd76d46aee58
Revises: 568caabeaa59
Create Date: 2025-11-19 18:03:15.932968

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd76d46aee58'
down_revision: Union[str, None] = '568caabeaa59'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add content_subcategory column to review_requests table
    op.add_column(
        'review_requests',
        sa.Column('content_subcategory', sa.String(length=50), nullable=True)
    )
    # Add index for subcategory filtering
    op.create_index(
        'idx_content_subcategory',
        'review_requests',
        ['content_type', 'content_subcategory', 'status'],
        unique=False
    )


def downgrade() -> None:
    # Drop index first
    op.drop_index('idx_content_subcategory', table_name='review_requests')
    # Drop content_subcategory column
    op.drop_column('review_requests', 'content_subcategory')
