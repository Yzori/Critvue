"""create portfolio table

Revision ID: i2b3c4d5e6f7
Revises: h1a2b3c4d5e6
Create Date: 2025-11-12 12:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'i2b3c4d5e6f7'
down_revision: Union[str, None] = 'h1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create portfolio table for user project showcase"""

    op.create_table(
        'portfolio',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content_type', sa.String(length=50), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('project_url', sa.String(length=500), nullable=True),
        sa.Column('rating', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('views_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_featured', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('idx_portfolio_user_created', 'portfolio', ['user_id', 'created_at'])
    op.create_index('idx_portfolio_content_type', 'portfolio', ['content_type', 'created_at'])
    op.create_index('idx_portfolio_featured', 'portfolio', ['is_featured', 'created_at'])
    op.create_index(op.f('ix_portfolio_id'), 'portfolio', ['id'], unique=False)
    op.create_index(op.f('ix_portfolio_user_id'), 'portfolio', ['user_id'], unique=False)
    op.create_index(op.f('ix_portfolio_content_type'), 'portfolio', ['content_type'], unique=False)


def downgrade() -> None:
    """Drop portfolio table"""

    # Drop indexes
    op.drop_index(op.f('ix_portfolio_content_type'), table_name='portfolio')
    op.drop_index(op.f('ix_portfolio_user_id'), table_name='portfolio')
    op.drop_index(op.f('ix_portfolio_id'), table_name='portfolio')
    op.drop_index('idx_portfolio_featured', table_name='portfolio')
    op.drop_index('idx_portfolio_content_type', table_name='portfolio')
    op.drop_index('idx_portfolio_user_created', table_name='portfolio')

    # Drop table
    op.drop_table('portfolio')
