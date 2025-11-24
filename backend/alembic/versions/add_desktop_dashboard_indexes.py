"""Add indexes for desktop dashboard optimization

Revision ID: add_desktop_indexes
Revises: d40e872d962b
Create Date: 2025-11-24

This migration adds database indexes to optimize desktop dashboard queries:
- Composite indexes for common filter combinations
- Indexes for sorting columns
- Full-text search optimization
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_desktop_indexes'
down_revision = 'd40e872d962b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add indexes for desktop dashboard optimization"""

    # Review Slots - Desktop Dashboard Indexes
    # =========================================

    # Index for creator actions-needed with sorting and filtering
    # Covers: status + auto_accept_at + submitted_at (urgency sorting)
    op.create_index(
        'idx_slot_status_auto_accept_submitted',
        'review_slots',
        ['status', 'auto_accept_at', 'submitted_at'],
        unique=False
    )

    # Index for desktop filtering by rating
    # Covers: status + rating (creator filtering submitted by rating)
    op.create_index(
        'idx_slot_status_rating',
        'review_slots',
        ['status', 'rating'],
        unique=False
    )

    # Index for reviewer active reviews with payment filtering
    # Covers: reviewer_id + status + payment_amount
    op.create_index(
        'idx_slot_reviewer_status_payment',
        'review_slots',
        ['reviewer_id', 'status', 'payment_amount'],
        unique=False
    )

    # Index for reviewer submitted reviews with sorting
    # Covers: reviewer_id + status + auto_accept_at
    op.create_index(
        'idx_slot_reviewer_submitted_accept',
        'review_slots',
        ['reviewer_id', 'status', 'auto_accept_at'],
        unique=False
    )

    # Index for activity timeline queries
    # Covers: reviewer_id + updated_at (for recent activity)
    op.create_index(
        'idx_slot_reviewer_updated',
        'review_slots',
        ['reviewer_id', 'updated_at'],
        unique=False
    )

    # Index for desktop draft filtering
    # Partial index for slots with drafts only (PostgreSQL)
    # Note: For SQLite, this will create a regular index
    try:
        op.execute("""
            CREATE INDEX idx_slot_status_has_draft
            ON review_slots (status)
            WHERE draft_sections IS NOT NULL
        """)
    except Exception:
        # Fallback for databases that don't support partial indexes
        op.create_index(
            'idx_slot_status_has_draft',
            'review_slots',
            ['status'],
            unique=False
        )

    # Review Requests - Desktop Dashboard Indexes
    # ===========================================

    # Index for creator my-requests with multiple filters
    # Covers: user_id + status + content_type + created_at
    op.create_index(
        'idx_request_user_status_type_created',
        'review_requests',
        ['user_id', 'status', 'content_type', 'created_at'],
        unique=False
    )

    # Index for desktop date range filtering
    # Covers: user_id + created_at (for date range queries)
    op.create_index(
        'idx_request_user_created',
        'review_requests',
        ['user_id', 'created_at'],
        unique=False
    )

    # Index for desktop updated_at sorting
    # Covers: user_id + updated_at
    op.create_index(
        'idx_request_user_updated',
        'review_requests',
        ['user_id', 'updated_at'],
        unique=False
    )

    # Index for search optimization (title + description)
    # PostgreSQL GIN index for full-text search
    try:
        op.execute("""
            CREATE INDEX idx_request_title_search
            ON review_requests
            USING gin(to_tsvector('english', title || ' ' || description))
        """)
    except Exception:
        # Fallback: Regular B-tree index on title for LIKE queries
        op.create_index(
            'idx_request_title_search',
            'review_requests',
            ['title'],
            unique=False
        )

    # Index for overview queries (status counts)
    # Covers: user_id + status + reviews_claimed
    op.create_index(
        'idx_request_user_status_claimed',
        'review_requests',
        ['user_id', 'status', 'reviews_claimed'],
        unique=False
    )

    # Users - Dashboard Optimization
    # ==============================

    # Index for reviewer lookups with tier filtering
    # Covers: id + user_tier (for reviewer details in lists)
    op.create_index(
        'idx_user_id_tier',
        'users',
        ['id', 'user_tier'],
        unique=False
    )

    # Notifications - Activity Timeline
    # =================================

    # Index for recent notifications lookup
    # Covers: user_id + created_at + is_read
    op.create_index(
        'idx_notification_user_created_read',
        'notifications',
        ['user_id', 'created_at', 'is_read'],
        unique=False
    )


def downgrade() -> None:
    """Remove desktop dashboard indexes"""

    # Review Slots indexes
    op.drop_index('idx_slot_status_auto_accept_submitted', table_name='review_slots')
    op.drop_index('idx_slot_status_rating', table_name='review_slots')
    op.drop_index('idx_slot_reviewer_status_payment', table_name='review_slots')
    op.drop_index('idx_slot_reviewer_submitted_accept', table_name='review_slots')
    op.drop_index('idx_slot_reviewer_updated', table_name='review_slots')
    op.drop_index('idx_slot_status_has_draft', table_name='review_slots')

    # Review Requests indexes
    op.drop_index('idx_request_user_status_type_created', table_name='review_requests')
    op.drop_index('idx_request_user_created', table_name='review_requests')
    op.drop_index('idx_request_user_updated', table_name='review_requests')
    op.drop_index('idx_request_title_search', table_name='review_requests')
    op.drop_index('idx_request_user_status_claimed', table_name='review_requests')

    # Users indexes
    op.drop_index('idx_user_id_tier', table_name='users')

    # Notifications indexes
    op.drop_index('idx_notification_user_created_read', table_name='notifications')
