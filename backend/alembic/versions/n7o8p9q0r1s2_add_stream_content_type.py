"""Add stream content type

Revision ID: n7o8p9q0r1s2
Revises: modern_karma_001
Create Date: 2025-11-28

Adds 'stream' to the content_type enum for streaming and short-form content
(TikTok, Reels, Shorts, live streams, VODs, etc.)
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'n7o8p9q0r1s2'
down_revision = 'modern_karma_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # For PostgreSQL: Add 'stream' to the content_type enum
    # SQLite doesn't have native enum support, so this is a no-op for SQLite

    # Check if we're using PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        # Add new enum value to contenttype
        op.execute("ALTER TYPE contenttype ADD VALUE IF NOT EXISTS 'stream'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values easily
    # For a full downgrade, you would need to:
    # 1. Create a new enum without 'stream'
    # 2. Update all columns to use the new enum
    # 3. Drop the old enum
    # 4. Rename the new enum

    # For simplicity, we'll leave the enum value in place during downgrade
    # since having an unused enum value is harmless
    pass
