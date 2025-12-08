"""add_reviewer_rating_tables

Revision ID: a85396e7b553
Revises: add_slot_applications
Create Date: 2025-12-08 17:56:58.358901

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a85396e7b553'
down_revision: Union[str, None] = 'add_slot_applications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create reviewer_ratings table (requesters rating reviewers)
    op.create_table(
        'reviewer_ratings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('review_slot_id', sa.Integer(), sa.ForeignKey('review_slots.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('requester_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('reviewer_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('quality_rating', sa.Integer(), nullable=False),
        sa.Column('professionalism_rating', sa.Integer(), nullable=False),
        sa.Column('helpfulness_rating', sa.Integer(), nullable=False),
        sa.Column('overall_rating', sa.Integer(), nullable=False),
        sa.Column('feedback_text', sa.Text(), nullable=True),
        sa.Column('is_anonymous', sa.Boolean(), default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now(), nullable=False, index=True),
    )

    # Create reviewer_stats table (aggregated reviewer statistics)
    op.create_table(
        'reviewer_stats',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('avg_quality', sa.Numeric(3, 2), nullable=True),
        sa.Column('avg_professionalism', sa.Numeric(3, 2), nullable=True),
        sa.Column('avg_helpfulness', sa.Numeric(3, 2), nullable=True),
        sa.Column('avg_overall', sa.Numeric(3, 2), nullable=True),
        sa.Column('total_ratings', sa.Integer(), default=0, nullable=False),
        sa.Column('total_reviews_completed', sa.Integer(), default=0, nullable=False),
        sa.Column('avg_review_time_hours', sa.Integer(), nullable=True),
        sa.Column('reviews_accepted', sa.Integer(), default=0, nullable=False),
        sa.Column('reviews_rejected', sa.Integer(), default=0, nullable=False),
        sa.Column('is_high_quality', sa.Boolean(), default=True, nullable=False),
        sa.Column('is_professional', sa.Boolean(), default=True, nullable=False),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('reviewer_stats')
    op.drop_table('reviewer_ratings')
