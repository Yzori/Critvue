"""Add payment system fields for Stripe Connect and expert review payments

Revision ID: add_payment_system
Revises: add_reviewer_listing_fields
Create Date: 2024-12-07

This migration adds:
- Stripe Connect fields to users table for reviewer payouts
- Payment Intent tracking to review_requests table
- Transfer tracking fields to review_slots table
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_payment_system'
down_revision = 'add_reviewer_listing_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add Stripe Connect fields to users table
    op.add_column('users', sa.Column('stripe_connect_account_id', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('stripe_connect_onboarded', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('stripe_connect_payouts_enabled', sa.Boolean(), nullable=False, server_default='0'))

    # Create unique index for stripe_connect_account_id
    op.create_index('ix_users_stripe_connect_account_id', 'users', ['stripe_connect_account_id'], unique=True)

    # Add Payment Intent tracking to review_requests table
    op.add_column('review_requests', sa.Column('stripe_payment_intent_id', sa.String(255), nullable=True))
    op.add_column('review_requests', sa.Column('payment_captured_at', sa.DateTime(), nullable=True))

    # Create index for payment_intent lookups
    op.create_index('ix_review_requests_payment_intent', 'review_requests', ['stripe_payment_intent_id'])

    # Add transfer tracking fields to review_slots table
    op.add_column('review_slots', sa.Column('stripe_transfer_id', sa.String(255), nullable=True))
    op.add_column('review_slots', sa.Column('platform_fee_amount', sa.Numeric(10, 2), nullable=True))
    op.add_column('review_slots', sa.Column('net_amount_to_reviewer', sa.Numeric(10, 2), nullable=True))

    # Create index for transfer lookups
    op.create_index('ix_review_slots_stripe_transfer_id', 'review_slots', ['stripe_transfer_id'])


def downgrade() -> None:
    # Remove indexes first
    op.drop_index('ix_review_slots_stripe_transfer_id', table_name='review_slots')
    op.drop_index('ix_review_requests_payment_intent', table_name='review_requests')
    op.drop_index('ix_users_stripe_connect_account_id', table_name='users')

    # Remove review_slots columns
    op.drop_column('review_slots', 'net_amount_to_reviewer')
    op.drop_column('review_slots', 'platform_fee_amount')
    op.drop_column('review_slots', 'stripe_transfer_id')

    # Remove review_requests columns
    op.drop_column('review_requests', 'payment_captured_at')
    op.drop_column('review_requests', 'stripe_payment_intent_id')

    # Remove users columns
    op.drop_column('users', 'stripe_connect_payouts_enabled')
    op.drop_column('users', 'stripe_connect_onboarded')
    op.drop_column('users', 'stripe_connect_account_id')
