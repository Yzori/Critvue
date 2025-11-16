"""add subscription fields to users

Revision ID: l5m6n7o8p9q0
Revises: k4l5m6n7o8p9
Create Date: 2025-11-16 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'l5m6n7o8p9q0'
down_revision: Union[str, None] = 'k4l5m6n7o8p9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add subscription-related fields to users table"""

    # Add subscription tier enum type
    # For SQLite, this will be handled as a CHECK constraint by SQLAlchemy
    # For PostgreSQL, we would create an ENUM type

    # Add subscription fields
    op.add_column('users', sa.Column(
        'subscription_tier',
        sa.Enum('FREE', 'PRO', name='subscriptiontier'),
        nullable=False,
        server_default='FREE'
    ))

    op.add_column('users', sa.Column(
        'subscription_status',
        sa.Enum('ACTIVE', 'CANCELED', 'PAST_DUE', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'UNPAID', name='subscriptionstatus'),
        nullable=True
    ))

    op.add_column('users', sa.Column('stripe_customer_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('stripe_subscription_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('subscription_end_date', sa.DateTime(), nullable=True))

    # Add review limit tracking fields for free tier
    op.add_column('users', sa.Column('monthly_reviews_used', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('reviews_reset_at', sa.DateTime(), nullable=True))

    # Create indexes for efficient querying
    op.create_index('idx_users_stripe_customer_id', 'users', ['stripe_customer_id'], unique=True)
    op.create_index('idx_users_stripe_subscription_id', 'users', ['stripe_subscription_id'], unique=True)
    op.create_index('idx_users_subscription_tier', 'users', ['subscription_tier'])
    op.create_index('idx_users_subscription_status', 'users', ['subscription_status'])


def downgrade() -> None:
    """Remove subscription-related fields from users table"""

    # Drop indexes
    op.drop_index('idx_users_subscription_status', table_name='users')
    op.drop_index('idx_users_subscription_tier', table_name='users')
    op.drop_index('idx_users_stripe_subscription_id', table_name='users')
    op.drop_index('idx_users_stripe_customer_id', table_name='users')

    # Drop review tracking fields
    op.drop_column('users', 'reviews_reset_at')
    op.drop_column('users', 'monthly_reviews_used')

    # Drop subscription fields
    op.drop_column('users', 'subscription_end_date')
    op.drop_column('users', 'stripe_subscription_id')
    op.drop_column('users', 'stripe_customer_id')
    op.drop_column('users', 'subscription_status')
    op.drop_column('users', 'subscription_tier')
