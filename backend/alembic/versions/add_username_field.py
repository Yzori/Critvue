"""Add username field to users table

Revision ID: add_username_field
Revises: 76423000d27c
Create Date: 2025-01-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_username_field'
down_revision: Union[str, None] = '76423000d27c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add username column to users table"""
    # Add username column (nullable initially to allow migration of existing users)
    op.add_column('users', sa.Column('username', sa.String(50), nullable=True))

    # Create unique index for username
    op.create_index('ix_users_username', 'users', ['username'], unique=True)


def downgrade() -> None:
    """Remove username column from users table"""
    op.drop_index('ix_users_username', table_name='users')
    op.drop_column('users', 'username')
