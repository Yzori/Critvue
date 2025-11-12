"""add_review_slots_table_and_workflow

Revision ID: 788b36ab8d73
Revises: g69145efb
Create Date: 2025-11-12 12:13:47.776685

This migration adds the review_slots table to track individual review slots
within a review request, enabling the full acceptance/rejection workflow.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision: str = '788b36ab8d73'
down_revision: Union[str, None] = 'g69145efb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create review_slots table (SQLite compatible - no ENUMs, use strings)
    op.create_table(
        'review_slots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('review_request_id', sa.Integer(), nullable=False),
        sa.Column('reviewer_id', sa.Integer(), nullable=True),

        # State management (use String instead of Enum for SQLite)
        sa.Column(
            'status',
            sa.String(20),
            nullable=False,
            server_default='available'
        ),

        # Lifecycle timestamps
        sa.Column('claimed_at', sa.DateTime(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('claim_deadline', sa.DateTime(), nullable=True),
        sa.Column('auto_accept_at', sa.DateTime(), nullable=True),

        # Review content
        sa.Column('review_text', sa.Text(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('review_attachments', sa.Text(), nullable=True),  # Use Text for SQLite (JSON stored as string)

        # Acceptance/Rejection metadata
        sa.Column(
            'acceptance_type',
            sa.String(20),
            nullable=True
        ),
        sa.Column(
            'rejection_reason',
            sa.String(20),
            nullable=True
        ),
        sa.Column('rejection_notes', sa.Text(), nullable=True),

        # Dispute handling
        sa.Column('is_disputed', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('dispute_reason', sa.Text(), nullable=True),
        sa.Column('dispute_resolved_at', sa.DateTime(), nullable=True),
        sa.Column(
            'dispute_resolution',
            sa.String(20),
            nullable=True
        ),
        sa.Column('dispute_notes', sa.Text(), nullable=True),

        # Payment tracking
        sa.Column('payment_amount', sa.Numeric(10, 2), nullable=True),
        sa.Column(
            'payment_status',
            sa.String(20),
            nullable=False,
            server_default='pending'
        ),
        sa.Column('payment_released_at', sa.DateTime(), nullable=True),
        sa.Column('transaction_id', sa.String(100), nullable=True),

        # Quality metrics
        sa.Column('requester_helpful_rating', sa.Integer(), nullable=True),

        # Audit trail
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),

        # Constraints
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        sa.CheckConstraint(
            'requester_helpful_rating >= 1 AND requester_helpful_rating <= 5',
            name='check_helpful_rating_range'
        ),
        sa.ForeignKeyConstraint(['review_request_id'], ['review_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for performance
    op.create_index('idx_slot_review_request', 'review_slots', ['review_request_id'])
    op.create_index('idx_slot_reviewer', 'review_slots', ['reviewer_id'])
    op.create_index('idx_slot_status', 'review_slots', ['status'])
    op.create_index('idx_slot_payment_status', 'review_slots', ['payment_status'])
    op.create_index('idx_slot_status_deadline', 'review_slots', ['status', 'claim_deadline'])
    op.create_index('idx_slot_status_auto_accept', 'review_slots', ['status', 'auto_accept_at'])
    op.create_index('idx_slot_reviewer_status', 'review_slots', ['reviewer_id', 'status'])
    op.create_index('idx_slot_request_status', 'review_slots', ['review_request_id', 'status'])

    # Add reviews_completed column to review_requests using batch mode for SQLite
    with op.batch_alter_table('review_requests', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('reviews_completed', sa.Integer(), nullable=False, server_default='0')
        )
        batch_op.create_index('idx_reviews_completed', ['reviews_completed'])


def downgrade() -> None:
    # Drop index and column from review_requests using batch mode for SQLite
    with op.batch_alter_table('review_requests', schema=None) as batch_op:
        batch_op.drop_index('idx_reviews_completed')
        batch_op.drop_column('reviews_completed')

    # Drop review_slots indexes
    op.drop_index('idx_slot_request_status', table_name='review_slots')
    op.drop_index('idx_slot_reviewer_status', table_name='review_slots')
    op.drop_index('idx_slot_status_auto_accept', table_name='review_slots')
    op.drop_index('idx_slot_status_deadline', table_name='review_slots')
    op.drop_index('idx_slot_payment_status', table_name='review_slots')
    op.drop_index('idx_slot_status', table_name='review_slots')
    op.drop_index('idx_slot_reviewer', table_name='review_slots')
    op.drop_index('idx_slot_review_request', table_name='review_slots')

    # Drop review_slots table
    op.drop_table('review_slots')
