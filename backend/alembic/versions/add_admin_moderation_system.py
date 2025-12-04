"""Add admin moderation system

Revision ID: add_admin_moderation
Revises: ce0ccb466f0b
Create Date: 2024-12-04

Adds:
- User moderation fields (ban, suspend)
- Admin audit log table for tracking all admin actions
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_admin_moderation'
down_revision = 'ce0ccb466f0b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add moderation fields to users table
    op.add_column('users', sa.Column('is_banned', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('banned_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('banned_by_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('ban_reason', sa.Text(), nullable=True))

    op.add_column('users', sa.Column('is_suspended', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('suspended_until', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('suspended_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('suspended_by_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('suspension_reason', sa.Text(), nullable=True))

    # Create admin audit log table
    op.create_table(
        'admin_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('target_user_id', sa.Integer(), nullable=True),
        sa.Column('target_entity_type', sa.String(50), nullable=True),
        sa.Column('target_entity_id', sa.Integer(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_user_id'], ['users.id'], ondelete='SET NULL'),
    )

    # Create indexes for efficient querying
    op.create_index('ix_admin_audit_logs_id', 'admin_audit_logs', ['id'])
    op.create_index('ix_admin_audit_logs_admin_id', 'admin_audit_logs', ['admin_id'])
    op.create_index('ix_admin_audit_logs_action', 'admin_audit_logs', ['action'])
    op.create_index('ix_admin_audit_logs_target_user_id', 'admin_audit_logs', ['target_user_id'])
    op.create_index('ix_admin_audit_logs_created_at', 'admin_audit_logs', ['created_at'])

    # Add indexes on users table for moderation queries
    op.create_index('ix_users_is_banned', 'users', ['is_banned'])
    op.create_index('ix_users_is_suspended', 'users', ['is_suspended'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_users_is_suspended', table_name='users')
    op.drop_index('ix_users_is_banned', table_name='users')

    op.drop_index('ix_admin_audit_logs_created_at', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_target_user_id', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_action', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_admin_id', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_id', table_name='admin_audit_logs')

    # Drop admin audit log table
    op.drop_table('admin_audit_logs')

    # Remove moderation columns from users
    op.drop_column('users', 'suspension_reason')
    op.drop_column('users', 'suspended_by_id')
    op.drop_column('users', 'suspended_at')
    op.drop_column('users', 'suspended_until')
    op.drop_column('users', 'is_suspended')
    op.drop_column('users', 'ban_reason')
    op.drop_column('users', 'banned_by_id')
    op.drop_column('users', 'banned_at')
    op.drop_column('users', 'is_banned')
