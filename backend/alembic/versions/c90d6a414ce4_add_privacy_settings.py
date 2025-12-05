"""add_privacy_settings

Revision ID: c90d6a414ce4
Revises: add_admin_moderation
Create Date: 2025-12-05 21:06:15.650565

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c90d6a414ce4'
down_revision: Union[str, None] = 'add_admin_moderation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'privacy_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('profile_visibility', sa.Enum('public', 'connections', 'private', name='profilevisibility'), nullable=False, server_default='public'),
        sa.Column('show_on_leaderboard', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('show_karma_publicly', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('show_activity_status', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('allow_review_discovery', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_privacy_settings_id'), 'privacy_settings', ['id'], unique=False)
    op.create_index(op.f('ix_privacy_settings_user_id'), 'privacy_settings', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_privacy_settings_user_id'), table_name='privacy_settings')
    op.drop_index(op.f('ix_privacy_settings_id'), table_name='privacy_settings')
    op.drop_table('privacy_settings')
    # Drop enum type
    sa.Enum(name='profilevisibility').drop(op.get_bind(), checkfirst=True)
