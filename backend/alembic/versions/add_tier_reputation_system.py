"""Add tier reputation system

Revision ID: tier_reputation_001
Revises: cd76d46aee58
Create Date: 2025-11-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'tier_reputation_001'
down_revision: Union[str, None] = 'cd76d46aee58'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add UserTier enum values (if using PostgreSQL, for SQLite it's just strings)
    # For SQLite, we don't need to create types explicitly

    # Add tier/reputation fields to users table
    op.add_column('users', sa.Column('user_tier', sa.String(20), nullable=False, server_default='novice'))
    op.add_column('users', sa.Column('karma_points', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('tier_achieved_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('expert_application_approved', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('acceptance_rate', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('users', sa.Column('accepted_reviews_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('longest_streak', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('last_review_date', sa.DateTime(), nullable=True))

    # Create indexes on new fields
    op.create_index(op.f('ix_users_user_tier'), 'users', ['user_tier'], unique=False)
    op.create_index(op.f('ix_users_karma_points'), 'users', ['karma_points'], unique=False)

    # Create karma_transactions table
    op.create_table(
        'karma_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('related_review_slot_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['related_review_slot_id'], ['review_slots.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_karma_transactions_id'), 'karma_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_karma_transactions_user_id'), 'karma_transactions', ['user_id'], unique=False)
    op.create_index(op.f('ix_karma_transactions_related_review_slot_id'), 'karma_transactions', ['related_review_slot_id'], unique=False)
    op.create_index(op.f('ix_karma_transactions_action'), 'karma_transactions', ['action'], unique=False)
    op.create_index(op.f('ix_karma_transactions_created_at'), 'karma_transactions', ['created_at'], unique=False)

    # Create tier_milestones table
    op.create_table(
        'tier_milestones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('from_tier', sa.String(20), nullable=True),
        sa.Column('to_tier', sa.String(20), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('karma_at_promotion', sa.Integer(), nullable=False),
        sa.Column('achieved_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tier_milestones_id'), 'tier_milestones', ['id'], unique=False)
    op.create_index(op.f('ix_tier_milestones_user_id'), 'tier_milestones', ['user_id'], unique=False)
    op.create_index(op.f('ix_tier_milestones_achieved_at'), 'tier_milestones', ['achieved_at'], unique=False)


def downgrade() -> None:
    # Drop tier_milestones table
    op.drop_index(op.f('ix_tier_milestones_achieved_at'), table_name='tier_milestones')
    op.drop_index(op.f('ix_tier_milestones_user_id'), table_name='tier_milestones')
    op.drop_index(op.f('ix_tier_milestones_id'), table_name='tier_milestones')
    op.drop_table('tier_milestones')

    # Drop karma_transactions table
    op.drop_index(op.f('ix_karma_transactions_created_at'), table_name='karma_transactions')
    op.drop_index(op.f('ix_karma_transactions_action'), table_name='karma_transactions')
    op.drop_index(op.f('ix_karma_transactions_related_review_slot_id'), table_name='karma_transactions')
    op.drop_index(op.f('ix_karma_transactions_user_id'), table_name='karma_transactions')
    op.drop_index(op.f('ix_karma_transactions_id'), table_name='karma_transactions')
    op.drop_table('karma_transactions')

    # Drop indexes on users table
    op.drop_index(op.f('ix_users_karma_points'), table_name='users')
    op.drop_index(op.f('ix_users_user_tier'), table_name='users')

    # Drop columns from users table
    op.drop_column('users', 'last_review_date')
    op.drop_column('users', 'longest_streak')
    op.drop_column('users', 'current_streak')
    op.drop_column('users', 'accepted_reviews_count')
    op.drop_column('users', 'acceptance_rate')
    op.drop_column('users', 'expert_application_approved')
    op.drop_column('users', 'tier_achieved_at')
    op.drop_column('users', 'karma_points')
    op.drop_column('users', 'user_tier')
