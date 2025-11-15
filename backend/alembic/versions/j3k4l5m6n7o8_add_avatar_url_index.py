"""add avatar_url index

Revision ID: j3k4l5m6n7o8
Revises: i2b3c4d5e6f7
Create Date: 2025-11-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'j3k4l5m6n7o8'
down_revision: Union[str, None] = 'i2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add index on avatar_url for efficient lookups and null checks"""

    # Add index for avatar_url to optimize queries that filter by avatar presence
    # Using partial index (PostgreSQL) to only index non-null values
    # For SQLite compatibility, we create a standard index
    op.create_index(
        'idx_users_avatar_url',
        'users',
        ['avatar_url'],
        unique=False
    )


def downgrade() -> None:
    """Remove avatar_url index"""

    op.drop_index('idx_users_avatar_url', table_name='users')
