"""Add unsubscribe token to notification preferences

Revision ID: 42a4d1d50dd9
Revises: 94838a15f0c1
Create Date: 2025-12-16 15:09:57.266101

Adds unsubscribe_token field to notification_preferences table
for one-click email unsubscribe (CAN-SPAM/GDPR compliance).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '42a4d1d50dd9'
down_revision: Union[str, None] = '94838a15f0c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add unsubscribe token column to notification_preferences
    op.add_column(
        'notification_preferences',
        sa.Column('unsubscribe_token', sa.String(64), nullable=True)
    )

    # Create unique index on unsubscribe token for fast lookups
    op.create_index(
        'ix_notification_preferences_unsubscribe_token',
        'notification_preferences',
        ['unsubscribe_token'],
        unique=True
    )


def downgrade() -> None:
    op.drop_index(
        'ix_notification_preferences_unsubscribe_token',
        'notification_preferences'
    )
    op.drop_column('notification_preferences', 'unsubscribe_token')
