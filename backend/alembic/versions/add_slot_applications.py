"""Add slot_applications table for expert review slot applications

Revision ID: add_slot_applications
Revises: rename_karma_to_sparks
Create Date: 2025-12-08

This migration creates the slot_applications table to enable an application
workflow for paid expert reviews. Instead of directly claiming slots, experts
apply with a pitch message, and creators review and accept/reject applicants.
"""

from alembic import op
import sqlalchemy as sa
from alembic.context import get_context


# revision identifiers, used by Alembic.
revision = 'add_slot_applications'
down_revision = 'rename_karma_to_sparks'
branch_labels = ('slot_applications',)
depends_on = None


def is_sqlite():
    """Check if we're running against SQLite"""
    context = get_context()
    return context.dialect.name == 'sqlite'


def upgrade() -> None:
    # Create slot_applications table
    op.create_table(
        'slot_applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('review_request_id', sa.Integer(), nullable=False),
        sa.Column('applicant_id', sa.Integer(), nullable=False),
        sa.Column('assigned_slot_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('pitch_message', sa.Text(), nullable=False),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('decided_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['review_request_id'], ['review_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['applicant_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_slot_id'], ['review_slots.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_slot_applications_id', 'slot_applications', ['id'])
    op.create_index('ix_slot_applications_review_request_id', 'slot_applications', ['review_request_id'])
    op.create_index('ix_slot_applications_applicant_id', 'slot_applications', ['applicant_id'])
    op.create_index('ix_slot_applications_assigned_slot_id', 'slot_applications', ['assigned_slot_id'])
    op.create_index('ix_slot_applications_status', 'slot_applications', ['status'])

    # Composite indexes for common queries
    op.create_index(
        'idx_slot_app_request_status',
        'slot_applications',
        ['review_request_id', 'status']
    )
    op.create_index(
        'idx_slot_app_user_status',
        'slot_applications',
        ['applicant_id', 'status']
    )
    op.create_index(
        'idx_slot_app_created',
        'slot_applications',
        ['created_at']
    )

    # Note: The unique partial index for preventing duplicate active applications
    # is handled at the application level since SQLite has limited partial index support
    # and PostgreSQL needs different syntax


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_slot_app_created', table_name='slot_applications')
    op.drop_index('idx_slot_app_user_status', table_name='slot_applications')
    op.drop_index('idx_slot_app_request_status', table_name='slot_applications')
    op.drop_index('ix_slot_applications_status', table_name='slot_applications')
    op.drop_index('ix_slot_applications_assigned_slot_id', table_name='slot_applications')
    op.drop_index('ix_slot_applications_applicant_id', table_name='slot_applications')
    op.drop_index('ix_slot_applications_review_request_id', table_name='slot_applications')
    op.drop_index('ix_slot_applications_id', table_name='slot_applications')

    # Drop table
    op.drop_table('slot_applications')
