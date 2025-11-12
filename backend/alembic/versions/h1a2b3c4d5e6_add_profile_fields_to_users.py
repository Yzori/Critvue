"""add profile fields to users

Revision ID: h1a2b3c4d5e6
Revises: 788b36ab8d73
Create Date: 2025-11-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'h1a2b3c4d5e6'
down_revision: Union[str, None] = '788b36ab8d73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add profile-related fields to users table"""

    # Add profile fields
    op.add_column('users', sa.Column('title', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('specialty_tags', sa.Text(), nullable=True))  # JSON stored as Text for SQLite
    op.add_column('users', sa.Column('badges', sa.Text(), nullable=True))  # JSON stored as Text for SQLite

    # Add stats fields
    op.add_column('users', sa.Column('total_reviews_given', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('total_reviews_received', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('avg_rating', sa.Numeric(precision=3, scale=2), nullable=True))
    op.add_column('users', sa.Column('avg_response_time_hours', sa.Integer(), nullable=True))

    # Add indexes for frequently queried fields
    op.create_index('idx_users_avg_rating', 'users', ['avg_rating'])
    op.create_index('idx_users_total_reviews_given', 'users', ['total_reviews_given'])


def downgrade() -> None:
    """Remove profile-related fields from users table"""

    # Drop indexes
    op.drop_index('idx_users_total_reviews_given', table_name='users')
    op.drop_index('idx_users_avg_rating', table_name='users')

    # Drop stats fields
    op.drop_column('users', 'avg_response_time_hours')
    op.drop_column('users', 'avg_rating')
    op.drop_column('users', 'total_reviews_received')
    op.drop_column('users', 'total_reviews_given')

    # Drop profile fields
    op.drop_column('users', 'badges')
    op.drop_column('users', 'specialty_tags')
    op.drop_column('users', 'title')
