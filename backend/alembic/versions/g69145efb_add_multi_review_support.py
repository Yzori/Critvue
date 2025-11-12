"""Add multi-review support to review_requests

Revision ID: g69145efb
Revises: d9e2f1b8a5c4
Create Date: 2025-11-12 00:00:00.000000

This migration adds support for multiple reviewers per review request:
- reviews_requested: How many reviews the user wants (1-10)
- reviews_claimed: How many slots have been claimed
- Validation: reviews_claimed cannot exceed reviews_requested
- Existing records get reviews_requested=1 for backward compatibility
- For existing records, reviews_claimed is set based on status:
  - If status='in_review' or 'completed', set to 1 (assumed claimed)
  - Otherwise, set to 0 (not claimed)

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g69145efb'
down_revision: Union[str, None] = 'd9e2f1b8a5c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add multi-review support columns using batch mode for SQLite compatibility"""

    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('review_requests', schema=None) as batch_op:
        # Add reviews_requested column (default 1, min 1, max 10)
        batch_op.add_column(
            sa.Column(
                'reviews_requested',
                sa.Integer(),
                nullable=False,
                server_default='1'
            )
        )

        # Add reviews_claimed column (default 0, tracks how many slots are claimed)
        batch_op.add_column(
            sa.Column(
                'reviews_claimed',
                sa.Integer(),
                nullable=False,
                server_default='0'
            )
        )

        # Create index on reviews_claimed for efficient filtering
        batch_op.create_index(
            batch_op.f('ix_review_requests_reviews_claimed'),
            ['reviews_claimed'],
            unique=False
        )

        # Create composite index for browse queries (status + reviews_claimed)
        batch_op.create_index(
            'idx_status_reviews_claimed',
            ['status', 'reviews_claimed'],
            unique=False
        )

    # Update existing records to set reviews_claimed based on status
    # If status is 'in_review' or 'completed', assume 1 slot is claimed
    op.execute("""
        UPDATE review_requests
        SET reviews_claimed = 1
        WHERE status IN ('in_review', 'completed')
    """)


def downgrade() -> None:
    """Remove multi-review support columns using batch mode for SQLite compatibility"""

    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('review_requests', schema=None) as batch_op:
        # Drop composite indexes
        batch_op.drop_index('idx_status_reviews_claimed')

        # Drop reviews_claimed index
        batch_op.drop_index(
            batch_op.f('ix_review_requests_reviews_claimed')
        )

        # Drop columns
        batch_op.drop_column('reviews_claimed')
        batch_op.drop_column('reviews_requested')
