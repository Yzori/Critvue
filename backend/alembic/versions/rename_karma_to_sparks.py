"""Rename karma to sparks and update tier names for creative community

Revision ID: rename_karma_to_sparks
Revises: add_payment_system
Create Date: 2025-12-08

This migration renames:
- karma_points -> sparks_points on users table
- karma_transactions -> sparks_transactions table
- karma_at_promotion -> sparks_at_promotion on tier_milestones table
- Updates tier enum values: NOVICE->NEWCOMER, CONTRIBUTOR->SUPPORTER, etc.
"""

from alembic import op
import sqlalchemy as sa
from alembic.context import get_context


# revision identifiers, used by Alembic.
revision = 'rename_karma_to_sparks'
down_revision = 'add_payment_system'
branch_labels = None
depends_on = None


def is_sqlite():
    """Check if we're running against SQLite"""
    context = get_context()
    return context.dialect.name == 'sqlite'


def upgrade() -> None:
    # ============= RENAME USERS TABLE COLUMNS =============

    # Rename karma_points to sparks_points
    # SQLite doesn't support ALTER COLUMN RENAME, need to use batch mode
    if is_sqlite():
        with op.batch_alter_table('users') as batch_op:
            batch_op.alter_column('karma_points', new_column_name='sparks_points')
    else:
        op.alter_column('users', 'karma_points', new_column_name='sparks_points')

    # ============= RENAME KARMA_TRANSACTIONS TABLE =============

    # Rename the table
    op.rename_table('karma_transactions', 'sparks_transactions')

    # ============= RENAME TIER_MILESTONES COLUMN =============

    # Rename karma_at_promotion to sparks_at_promotion
    if is_sqlite():
        with op.batch_alter_table('tier_milestones') as batch_op:
            batch_op.alter_column('karma_at_promotion', new_column_name='sparks_at_promotion')
    else:
        op.alter_column('tier_milestones', 'karma_at_promotion', new_column_name='sparks_at_promotion')

    # ============= UPDATE TIER ENUM VALUES =============
    # Note: This updates the enum type to use new creative-focused tier names
    # For SQLite, enums are just strings so we only need to update the data
    # For PostgreSQL, we need to add new enum values first

    if not is_sqlite():
        # PostgreSQL approach - add new enum values
        op.execute("ALTER TYPE usertier ADD VALUE IF NOT EXISTS 'newcomer'")
        op.execute("ALTER TYPE usertier ADD VALUE IF NOT EXISTS 'supporter'")
        op.execute("ALTER TYPE usertier ADD VALUE IF NOT EXISTS 'guide'")
        op.execute("ALTER TYPE usertier ADD VALUE IF NOT EXISTS 'mentor'")
        op.execute("ALTER TYPE usertier ADD VALUE IF NOT EXISTS 'curator'")
        op.execute("ALTER TYPE usertier ADD VALUE IF NOT EXISTS 'visionary'")

    # Update existing records to new tier names
    # SQLite uses single statements
    op.execute("UPDATE users SET user_tier = 'newcomer' WHERE user_tier = 'novice'")
    op.execute("UPDATE users SET user_tier = 'supporter' WHERE user_tier = 'contributor'")
    op.execute("UPDATE users SET user_tier = 'guide' WHERE user_tier = 'skilled'")
    op.execute("UPDATE users SET user_tier = 'mentor' WHERE user_tier = 'trusted_advisor'")
    op.execute("UPDATE users SET user_tier = 'curator' WHERE user_tier = 'expert'")
    op.execute("UPDATE users SET user_tier = 'visionary' WHERE user_tier = 'master'")

    # Update tier_milestones table
    op.execute("UPDATE tier_milestones SET from_tier = 'newcomer' WHERE from_tier = 'novice'")
    op.execute("UPDATE tier_milestones SET from_tier = 'supporter' WHERE from_tier = 'contributor'")
    op.execute("UPDATE tier_milestones SET from_tier = 'guide' WHERE from_tier = 'skilled'")
    op.execute("UPDATE tier_milestones SET from_tier = 'mentor' WHERE from_tier = 'trusted_advisor'")
    op.execute("UPDATE tier_milestones SET from_tier = 'curator' WHERE from_tier = 'expert'")
    op.execute("UPDATE tier_milestones SET from_tier = 'visionary' WHERE from_tier = 'master'")

    op.execute("UPDATE tier_milestones SET to_tier = 'newcomer' WHERE to_tier = 'novice'")
    op.execute("UPDATE tier_milestones SET to_tier = 'supporter' WHERE to_tier = 'contributor'")
    op.execute("UPDATE tier_milestones SET to_tier = 'guide' WHERE to_tier = 'skilled'")
    op.execute("UPDATE tier_milestones SET to_tier = 'mentor' WHERE to_tier = 'trusted_advisor'")
    op.execute("UPDATE tier_milestones SET to_tier = 'curator' WHERE to_tier = 'expert'")
    op.execute("UPDATE tier_milestones SET to_tier = 'visionary' WHERE to_tier = 'master'")

    # ============= UPDATE BADGE REQUIREMENT TYPES =============

    # Update badges that had total_karma requirement type to total_sparks
    op.execute("UPDATE badges SET requirement_type = 'total_sparks' WHERE requirement_type = 'total_karma'")

    # Update Karma King badge to Sparks Legend
    op.execute("""
        UPDATE badges
        SET code = 'milestone_sparks_legend',
            name = 'Sparks Legend',
            description = 'Reached 5,000 Sparks'
        WHERE code = 'milestone_karma_king'
    """)


def downgrade() -> None:
    # ============= REVERT BADGE CHANGES =============

    op.execute("UPDATE badges SET requirement_type = 'total_karma' WHERE requirement_type = 'total_sparks'")

    op.execute("""
        UPDATE badges
        SET code = 'milestone_karma_king',
            name = 'Karma King',
            description = 'Reached 5,000 karma points'
        WHERE code = 'milestone_sparks_legend'
    """)

    # ============= REVERT TIER VALUES =============

    op.execute("UPDATE tier_milestones SET from_tier = 'novice' WHERE from_tier = 'newcomer'")
    op.execute("UPDATE tier_milestones SET from_tier = 'contributor' WHERE from_tier = 'supporter'")
    op.execute("UPDATE tier_milestones SET from_tier = 'skilled' WHERE from_tier = 'guide'")
    op.execute("UPDATE tier_milestones SET from_tier = 'trusted_advisor' WHERE from_tier = 'mentor'")
    op.execute("UPDATE tier_milestones SET from_tier = 'expert' WHERE from_tier = 'curator'")
    op.execute("UPDATE tier_milestones SET from_tier = 'master' WHERE from_tier = 'visionary'")

    op.execute("UPDATE tier_milestones SET to_tier = 'novice' WHERE to_tier = 'newcomer'")
    op.execute("UPDATE tier_milestones SET to_tier = 'contributor' WHERE to_tier = 'supporter'")
    op.execute("UPDATE tier_milestones SET to_tier = 'skilled' WHERE to_tier = 'guide'")
    op.execute("UPDATE tier_milestones SET to_tier = 'trusted_advisor' WHERE to_tier = 'mentor'")
    op.execute("UPDATE tier_milestones SET to_tier = 'expert' WHERE to_tier = 'curator'")
    op.execute("UPDATE tier_milestones SET to_tier = 'master' WHERE to_tier = 'visionary'")

    op.execute("UPDATE users SET user_tier = 'novice' WHERE user_tier = 'newcomer'")
    op.execute("UPDATE users SET user_tier = 'contributor' WHERE user_tier = 'supporter'")
    op.execute("UPDATE users SET user_tier = 'skilled' WHERE user_tier = 'guide'")
    op.execute("UPDATE users SET user_tier = 'trusted_advisor' WHERE user_tier = 'mentor'")
    op.execute("UPDATE users SET user_tier = 'expert' WHERE user_tier = 'curator'")
    op.execute("UPDATE users SET user_tier = 'master' WHERE user_tier = 'visionary'")

    # ============= REVERT COLUMN RENAMES =============

    if is_sqlite():
        with op.batch_alter_table('tier_milestones') as batch_op:
            batch_op.alter_column('sparks_at_promotion', new_column_name='karma_at_promotion')
    else:
        op.alter_column('tier_milestones', 'sparks_at_promotion', new_column_name='karma_at_promotion')

    op.rename_table('sparks_transactions', 'karma_transactions')

    if is_sqlite():
        with op.batch_alter_table('users') as batch_op:
            batch_op.alter_column('sparks_points', new_column_name='karma_points')
    else:
        op.alter_column('users', 'sparks_points', new_column_name='karma_points')
