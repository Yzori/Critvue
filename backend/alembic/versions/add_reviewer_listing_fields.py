"""Add reviewer listing and onboarding fields

Revision ID: add_reviewer_listing_fields
Revises: add_username_field
Create Date: 2024-12-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_reviewer_listing_fields'
down_revision: Union[str, None] = 'add_username_field'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add reviewer directory listing fields
    op.add_column('users', sa.Column('is_listed_as_reviewer', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('reviewer_availability', sa.String(20), nullable=False, server_default='available'))
    op.add_column('users', sa.Column('reviewer_tagline', sa.String(200), nullable=True))

    # Add onboarding fields
    op.add_column('users', sa.Column('onboarding_completed', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('primary_interest', sa.String(20), nullable=True))

    # Create index on is_listed_as_reviewer for directory queries
    op.create_index('ix_users_is_listed_as_reviewer', 'users', ['is_listed_as_reviewer'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_users_is_listed_as_reviewer', table_name='users')
    op.drop_column('users', 'primary_interest')
    op.drop_column('users', 'onboarding_completed')
    op.drop_column('users', 'reviewer_tagline')
    op.drop_column('users', 'reviewer_availability')
    op.drop_column('users', 'is_listed_as_reviewer')
