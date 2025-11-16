"""create expert_applications table

Revision ID: k4l5m6n7o8p9
Revises: j3k4l5m6n7o8
Create Date: 2025-11-16 13:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'k4l5m6n7o8p9'
down_revision: Union[str, None] = 'j3k4l5m6n7o8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create expert_applications table - SAFE migration that only adds a new table"""

    # Create expert_applications table
    op.create_table(
        'expert_applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN', name='applicationstatus'), nullable=False),
        sa.Column('application_data', sa.JSON(), nullable=True),
        sa.Column('application_number', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Create indexes for efficient querying
    op.create_index('idx_expert_app_user_status', 'expert_applications', ['user_id', 'status'], unique=False)
    op.create_index('idx_expert_app_created', 'expert_applications', ['created_at'], unique=False)
    op.create_index('idx_expert_app_application_number', 'expert_applications', ['application_number'], unique=True)
    op.create_index(op.f('ix_expert_applications_id'), 'expert_applications', ['id'], unique=False)
    op.create_index(op.f('ix_expert_applications_status'), 'expert_applications', ['status'], unique=False)


def downgrade() -> None:
    """Remove expert_applications table"""

    # Drop indexes
    op.drop_index(op.f('ix_expert_applications_status'), table_name='expert_applications')
    op.drop_index(op.f('ix_expert_applications_id'), table_name='expert_applications')
    op.drop_index('idx_expert_app_application_number', table_name='expert_applications')
    op.drop_index('idx_expert_app_created', table_name='expert_applications')
    op.drop_index('idx_expert_app_user_status', table_name='expert_applications')

    # Drop table
    op.drop_table('expert_applications')
