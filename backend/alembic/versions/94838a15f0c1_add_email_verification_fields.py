"""Add email verification fields to users table

Revision ID: 94838a15f0c1
Revises: a85396e7b553
Create Date: 2025-12-16 15:09:36.656033

Adds email_verification_token and email_verification_expires_at fields
to users table for email verification on registration.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94838a15f0c1'
down_revision: Union[str, None] = 'a85396e7b553'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add email verification columns to users table
    op.add_column(
        'users',
        sa.Column('email_verification_token', sa.String(255), nullable=True)
    )
    op.add_column(
        'users',
        sa.Column('email_verification_expires_at', sa.DateTime(), nullable=True)
    )

    # Create index on verification token for fast lookups
    op.create_index(
        'ix_users_email_verification_token',
        'users',
        ['email_verification_token']
    )


def downgrade() -> None:
    op.drop_index('ix_users_email_verification_token', 'users')
    op.drop_column('users', 'email_verification_expires_at')
    op.drop_column('users', 'email_verification_token')
