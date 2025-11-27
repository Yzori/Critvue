"""Add NDA support for confidential review requests

Revision ID: nda_support_001
Revises: committee_system_001
Create Date: 2024-11-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'nda_support_001'
down_revision: Union[str, None] = 'committee_system_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add NDA fields to review_requests and create nda_signatures table."""

    # 1. Add NDA fields to review_requests table
    op.add_column(
        'review_requests',
        sa.Column('requires_nda', sa.Boolean(), nullable=False, server_default='0')
    )
    op.add_column(
        'review_requests',
        sa.Column('nda_version', sa.String(50), nullable=True)
    )

    # Index for filtering NDA-required requests
    op.create_index('idx_requires_nda', 'review_requests', ['requires_nda'])

    # 2. Create nda_signatures table for audit trail
    op.create_table(
        'nda_signatures',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('review_request_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),  # 'creator' or 'reviewer'
        sa.Column('full_legal_name', sa.String(255), nullable=False),
        sa.Column('nda_version', sa.String(50), nullable=False),
        sa.Column('signature_ip', sa.String(45), nullable=True),  # IPv4 or IPv6
        sa.Column('signature_user_agent', sa.String(500), nullable=True),
        sa.Column('signed_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['review_request_id'], ['review_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Indexes for nda_signatures
    op.create_index('idx_nda_sig_request', 'nda_signatures', ['review_request_id'])
    op.create_index('idx_nda_sig_user', 'nda_signatures', ['user_id'])
    op.create_index('idx_nda_sig_request_user', 'nda_signatures', ['review_request_id', 'user_id'])
    op.create_index('idx_nda_sig_request_role', 'nda_signatures', ['review_request_id', 'role'])

    # 3. Add nda_signed field to review_slots for quick lookup
    op.add_column(
        'review_slots',
        sa.Column('nda_signed_at', sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    """Remove NDA support."""

    # Remove nda_signed_at from review_slots
    op.drop_column('review_slots', 'nda_signed_at')

    # Drop nda_signatures table
    op.drop_index('idx_nda_sig_request_role', table_name='nda_signatures')
    op.drop_index('idx_nda_sig_request_user', table_name='nda_signatures')
    op.drop_index('idx_nda_sig_user', table_name='nda_signatures')
    op.drop_index('idx_nda_sig_request', table_name='nda_signatures')
    op.drop_table('nda_signatures')

    # Remove NDA fields from review_requests
    op.drop_index('idx_requires_nda', table_name='review_requests')
    op.drop_column('review_requests', 'nda_version')
    op.drop_column('review_requests', 'requires_nda')
