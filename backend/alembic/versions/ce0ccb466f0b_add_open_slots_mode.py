"""add_open_slots_mode

Revision ID: ce0ccb466f0b
Revises: e97022c7f53b
Create Date: 2025-12-03 21:56:34.717614

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce0ccb466f0b'
down_revision: Union[str, None] = 'e97022c7f53b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add invitation_mode column with default value
    op.add_column(
        'challenges',
        sa.Column(
            'invitation_mode',
            sa.Enum('admin_curated', 'open_slots', name='invitationmode'),
            nullable=False,
            server_default='admin_curated'
        )
    )

    # Add slots_open_at column
    op.add_column(
        'challenges',
        sa.Column('slots_open_at', sa.DateTime(), nullable=True)
    )

    # Add slots_close_at column
    op.add_column(
        'challenges',
        sa.Column('slots_close_at', sa.DateTime(), nullable=True)
    )

    # Create index for open slots queries
    op.create_index(
        'idx_challenge_open_slots',
        'challenges',
        ['status', 'challenge_type', 'invitation_mode'],
        unique=False
    )


def downgrade() -> None:
    # Drop the index
    op.drop_index('idx_challenge_open_slots', table_name='challenges')

    # Drop the columns
    op.drop_column('challenges', 'slots_close_at')
    op.drop_column('challenges', 'slots_open_at')
    op.drop_column('challenges', 'invitation_mode')

    # Drop the enum type (only works for PostgreSQL)
    # For SQLite, enums are stored as strings
    op.execute("DROP TYPE IF EXISTS invitationmode")
