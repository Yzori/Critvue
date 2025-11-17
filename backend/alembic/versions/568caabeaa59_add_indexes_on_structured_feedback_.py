"""add_indexes_on_structured_feedback_columns

Revision ID: 568caabeaa59
Revises: d4f376c4ae1c
Create Date: 2025-11-17 20:49:48.376549

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '568caabeaa59'
down_revision: Union[str, None] = 'd4f376c4ae1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get the database connection to check dialect
    bind = op.get_bind()

    # GIN indexes are PostgreSQL-specific, skip for SQLite
    if bind.dialect.name == 'postgresql':
        # Add GIN indexes for JSON columns to improve query performance
        # GIN (Generalized Inverted Index) is optimal for JSONB columns
        op.create_index(
            'idx_review_slots_feedback_sections_gin',
            'review_slots',
            ['feedback_sections'],
            postgresql_using='gin'
        )
        op.create_index(
            'idx_review_slots_annotations_gin',
            'review_slots',
            ['annotations'],
            postgresql_using='gin'
        )
        op.create_index(
            'idx_review_slots_draft_sections_gin',
            'review_slots',
            ['draft_sections'],
            postgresql_using='gin'
        )


def downgrade() -> None:
    # Get the database connection to check dialect
    bind = op.get_bind()

    # Only drop indexes if we're using PostgreSQL
    if bind.dialect.name == 'postgresql':
        op.drop_index('idx_review_slots_draft_sections_gin', table_name='review_slots')
        op.drop_index('idx_review_slots_annotations_gin', table_name='review_slots')
        op.drop_index('idx_review_slots_feedback_sections_gin', table_name='review_slots')
