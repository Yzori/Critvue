"""add_notification_system

Revision ID: d40e872d962b
Revises: tier_reputation_001
Create Date: 2025-11-23 20:30:50.157045

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.sqlite import JSON


# revision identifiers, used by Alembic.
revision: str = 'd40e872d962b'
down_revision: Union[str, None] = 'tier_reputation_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('data', JSON(), nullable=True),
        sa.Column('read', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('archived', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('action_url', sa.String(length=500), nullable=True),
        sa.Column('action_label', sa.String(length=100), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('channels', JSON(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Create indexes for notifications table
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_type', 'notifications', ['type'])
    op.create_index('ix_notifications_read', 'notifications', ['read'])
    op.create_index('ix_notifications_archived', 'notifications', ['archived'])
    op.create_index('ix_notifications_entity_type', 'notifications', ['entity_type'])
    op.create_index('ix_notifications_entity_id', 'notifications', ['entity_id'])
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])
    op.create_index('ix_notifications_expires_at', 'notifications', ['expires_at'])

    # Create composite index for user's unread notifications
    op.create_index(
        'ix_notifications_user_unread',
        'notifications',
        ['user_id', 'read', 'created_at'],
    )

    # Create notification_preferences table
    op.create_table(
        'notification_preferences',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email_enabled', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('push_enabled', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('sms_enabled', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('email_digest_frequency', sa.String(length=20), nullable=False, server_default='immediate'),
        sa.Column('email_digest_time', sa.Integer(), nullable=False, server_default='9'),
        sa.Column('email_digest_day', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('quiet_hours_enabled', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('quiet_hours_start', sa.Integer(), nullable=True),
        sa.Column('quiet_hours_end', sa.Integer(), nullable=True),
        sa.Column('category_preferences', JSON(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('user_id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )


def downgrade() -> None:
    # Drop notification_preferences table
    op.drop_table('notification_preferences')

    # Drop indexes for notifications table
    op.drop_index('ix_notifications_user_unread', table_name='notifications')
    op.drop_index('ix_notifications_expires_at', table_name='notifications')
    op.drop_index('ix_notifications_created_at', table_name='notifications')
    op.drop_index('ix_notifications_entity_id', table_name='notifications')
    op.drop_index('ix_notifications_entity_type', table_name='notifications')
    op.drop_index('ix_notifications_archived', table_name='notifications')
    op.drop_index('ix_notifications_read', table_name='notifications')
    op.drop_index('ix_notifications_type', table_name='notifications')
    op.drop_index('ix_notifications_user_id', table_name='notifications')

    # Drop notifications table
    op.drop_table('notifications')
