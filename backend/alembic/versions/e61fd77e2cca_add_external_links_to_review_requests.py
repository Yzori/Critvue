"""add_external_links_to_review_requests

Revision ID: e61fd77e2cca
Revises: 299ccc3e31d8
Create Date: 2025-11-30 14:20:40.762590

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e61fd77e2cca'
down_revision: Union[str, None] = '299ccc3e31d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add external_links column for storing video/streaming URLs (YouTube, Twitch, etc.)
    op.add_column(
        'review_requests',
        sa.Column('external_links', sa.JSON(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('review_requests', 'external_links')
