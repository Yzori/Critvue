"""Add reviewer_dna table

Revision ID: reviewer_dna_001
Revises: 71cbfcf1ccdb
Create Date: 2024-11-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'reviewer_dna_001'
down_revision: Union[str, None] = 'modern_karma_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create reviewer_dna table."""
    op.create_table(
        'reviewer_dna',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),

        # DNA Dimensions (0-100 scale)
        sa.Column('speed', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('depth', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('specificity', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('constructiveness', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('technical', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('encouragement', sa.Float(), nullable=False, server_default='50.0'),

        # Overall score
        sa.Column('overall_score', sa.Float(), nullable=False, server_default='50.0'),

        # Metadata
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('reviews_analyzed', sa.Integer(), nullable=False, server_default='0'),

        # Timestamps
        sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),

        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', name='uq_reviewer_dna_user_id'),
    )

    # Create indexes
    op.create_index('idx_reviewer_dna_user_id', 'reviewer_dna', ['user_id'])
    op.create_index('idx_reviewer_dna_overall', 'reviewer_dna', ['overall_score'])
    op.create_index('idx_reviewer_dna_calculated', 'reviewer_dna', ['calculated_at'])


def downgrade() -> None:
    """Drop reviewer_dna table."""
    op.drop_index('idx_reviewer_dna_calculated', table_name='reviewer_dna')
    op.drop_index('idx_reviewer_dna_overall', table_name='reviewer_dna')
    op.drop_index('idx_reviewer_dna_user_id', table_name='reviewer_dna')
    op.drop_table('reviewer_dna')
