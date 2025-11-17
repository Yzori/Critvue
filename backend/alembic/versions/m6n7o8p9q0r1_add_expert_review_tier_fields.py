"""add expert review tier fields

Revision ID: m6n7o8p9q0r1
Revises: l5m6n7o8p9q0
Create Date: 2025-11-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'm6n7o8p9q0r1'
down_revision: Union[str, None] = 'l5m6n7o8p9q0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add expert review tier fields to review_requests table"""

    # Add tier enum type
    # For SQLite, this will be handled as a CHECK constraint by SQLAlchemy
    # For PostgreSQL, we would create an ENUM type

    # Add tier field - nullable for FREE reviews (backward compatible)
    op.add_column('review_requests', sa.Column(
        'tier',
        sa.Enum('quick', 'standard', 'deep', name='reviewtier'),
        nullable=True,
        comment='Expert review tier: quick (5-10min), standard (15-20min), deep (30+ min). NULL for free reviews.'
    ))

    # Add feedback_priority field - optional, provides context for expert reviewers
    op.add_column('review_requests', sa.Column(
        'feedback_priority',
        sa.Enum('validation', 'specific_fixes', 'strategic_direction', 'comprehensive', name='feedbackpriority'),
        nullable=True,
        comment='Primary focus area for the review: validation, specific_fixes, strategic_direction, or comprehensive'
    ))

    # Add specific_questions field - JSON array of strings for targeted questions
    op.add_column('review_requests', sa.Column(
        'specific_questions',
        sa.JSON(),
        nullable=True,
        comment='JSON array of specific questions the requester wants answered'
    ))

    # Add context field - additional context for expert reviewers
    op.add_column('review_requests', sa.Column(
        'context',
        sa.Text(),
        nullable=True,
        comment='Additional context about the project, target audience, goals, etc.'
    ))

    # Add estimated_duration field - expected review duration in minutes
    op.add_column('review_requests', sa.Column(
        'estimated_duration',
        sa.Integer(),
        nullable=True,
        comment='Estimated review duration in minutes based on tier'
    ))

    # Create indexes for efficient querying
    # Index for filtering expert reviews by tier
    op.create_index('idx_review_requests_tier', 'review_requests', ['tier'])

    # Composite index for filtering expert reviews (review_type + tier)
    op.create_index(
        'idx_review_type_tier',
        'review_requests',
        ['review_type', 'tier'],
        postgresql_where=sa.text("review_type = 'expert'")
    )


def downgrade() -> None:
    """Remove expert review tier fields from review_requests table"""

    # Drop indexes
    op.drop_index('idx_review_type_tier', table_name='review_requests')
    op.drop_index('idx_review_requests_tier', table_name='review_requests')

    # Drop columns
    op.drop_column('review_requests', 'estimated_duration')
    op.drop_column('review_requests', 'context')
    op.drop_column('review_requests', 'specific_questions')
    op.drop_column('review_requests', 'feedback_priority')
    op.drop_column('review_requests', 'tier')

    # Drop enum types (PostgreSQL only, SQLite will ignore)
    # Note: Alembic doesn't auto-drop enum types on PostgreSQL
    # You may need to manually drop them if needed:
    # op.execute("DROP TYPE IF EXISTS reviewtier")
    # op.execute("DROP TYPE IF EXISTS feedbackpriority")
