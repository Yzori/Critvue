"""add_structured_feedback_to_review_slots

Revision ID: d4f376c4ae1c
Revises: m6n7o8p9q0r1
Create Date: 2025-11-17 20:26:56.755739

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4f376c4ae1c'
down_revision: Union[str, None] = 'm6n7o8p9q0r1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add feedback_sections column for structured section-based feedback
    # Store as JSON for flexible structure
    op.add_column(
        'review_slots',
        sa.Column('feedback_sections', sa.JSON(), nullable=True)
    )

    # Add annotations column for context-specific annotations
    # (pins, timestamps, line comments, highlights)
    op.add_column(
        'review_slots',
        sa.Column('annotations', sa.JSON(), nullable=True)
    )

    # Add draft_sections column for auto-saving section drafts
    op.add_column(
        'review_slots',
        sa.Column('draft_sections', sa.JSON(), nullable=True)
    )


def downgrade() -> None:
    # Remove the added columns
    op.drop_column('review_slots', 'draft_sections')
    op.drop_column('review_slots', 'annotations')
    op.drop_column('review_slots', 'feedback_sections')
