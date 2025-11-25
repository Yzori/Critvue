"""Add modern karma system: badges, leaderboards, requester ratings

Revision ID: modern_karma_001
Revises: add_desktop_indexes
Create Date: 2025-11-25

This migration adds the comprehensive modern karma system:
- XP/Reputation split (permanent XP, variable reputation)
- Streak shields and weekend grace
- Graduated penalty system with warnings
- Weekly goals system
- Badges and achievements
- Seasonal leaderboards
- Two-sided requester ratings
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'modern_karma_001'
down_revision = 'add_desktop_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ============= NEW USER FIELDS =============

    # XP + Reputation split
    op.add_column('users', sa.Column('xp_points', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('reputation_score', sa.Integer(), nullable=False, server_default='100'))
    op.add_column('users', sa.Column('last_active_date', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('reputation_percentile', sa.Integer(), nullable=True))

    # Streak protection system
    op.add_column('users', sa.Column('streak_shield_count', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('streak_shield_used_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('streak_protected_until', sa.DateTime(), nullable=True))

    # Graduated penalty system
    op.add_column('users', sa.Column('warning_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('last_warning_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('penalty_multiplier', sa.Numeric(precision=3, scale=2), nullable=False, server_default='1.0'))

    # Weekly goals system
    op.add_column('users', sa.Column('weekly_reviews_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('weekly_goal_target', sa.Integer(), nullable=False, server_default='3'))
    op.add_column('users', sa.Column('weekly_goal_streak', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('week_start_date', sa.DateTime(), nullable=True))

    # Create index on xp_points for leaderboards
    op.create_index(op.f('ix_users_xp_points'), 'users', ['xp_points'], unique=False)

    # ============= BADGES TABLE =============
    op.create_table(
        'badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(100), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(20), nullable=False),  # skill, milestone, streak, quality, special, seasonal
        sa.Column('rarity', sa.String(20), nullable=False, server_default='common'),  # common, uncommon, rare, epic, legendary
        sa.Column('karma_reward', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('xp_reward', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('icon_url', sa.String(500), nullable=True),
        sa.Column('color', sa.String(50), nullable=True),
        sa.Column('requirement_type', sa.String(100), nullable=True),
        sa.Column('requirement_value', sa.Integer(), nullable=True),
        sa.Column('requirement_skill', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_badges_id'), 'badges', ['id'], unique=False)
    op.create_index(op.f('ix_badges_code'), 'badges', ['code'], unique=True)
    op.create_index(op.f('ix_badges_category'), 'badges', ['category'], unique=False)

    # ============= USER_BADGES TABLE =============
    op.create_table(
        'user_badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('badge_id', sa.Integer(), nullable=False),
        sa.Column('earned_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('earning_reason', sa.Text(), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_hidden', sa.Boolean(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['badge_id'], ['badges.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_badges_id'), 'user_badges', ['id'], unique=False)
    op.create_index(op.f('ix_user_badges_user_id'), 'user_badges', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_badges_badge_id'), 'user_badges', ['badge_id'], unique=False)
    op.create_index(op.f('ix_user_badges_earned_at'), 'user_badges', ['earned_at'], unique=False)

    # ============= SEASONS TABLE =============
    op.create_table(
        'seasons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('season_type', sa.String(20), nullable=False),  # weekly, monthly, quarterly
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_finalized', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('rewards_description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_seasons_id'), 'seasons', ['id'], unique=False)
    op.create_index(op.f('ix_seasons_season_type'), 'seasons', ['season_type'], unique=False)
    op.create_index(op.f('ix_seasons_start_date'), 'seasons', ['start_date'], unique=False)
    op.create_index(op.f('ix_seasons_end_date'), 'seasons', ['end_date'], unique=False)
    op.create_index(op.f('ix_seasons_is_active'), 'seasons', ['is_active'], unique=False)

    # ============= LEADERBOARD_ENTRIES TABLE =============
    op.create_table(
        'leaderboard_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('season_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(20), nullable=False),  # overall, reviews, quality, helpful, skill, newcomer
        sa.Column('skill', sa.String(100), nullable=True),
        sa.Column('score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reviews_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('karma_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('xp_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_rating', sa.Integer(), nullable=True),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('percentile', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['season_id'], ['seasons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_leaderboard_entries_id'), 'leaderboard_entries', ['id'], unique=False)
    op.create_index(op.f('ix_leaderboard_entries_user_id'), 'leaderboard_entries', ['user_id'], unique=False)
    op.create_index(op.f('ix_leaderboard_entries_season_id'), 'leaderboard_entries', ['season_id'], unique=False)
    op.create_index(op.f('ix_leaderboard_entries_category'), 'leaderboard_entries', ['category'], unique=False)
    op.create_index(op.f('ix_leaderboard_entries_skill'), 'leaderboard_entries', ['skill'], unique=False)
    op.create_index(op.f('ix_leaderboard_entries_score'), 'leaderboard_entries', ['score'], unique=False)
    op.create_index(op.f('ix_leaderboard_entries_rank'), 'leaderboard_entries', ['rank'], unique=False)

    # ============= REQUESTER_RATINGS TABLE =============
    op.create_table(
        'requester_ratings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('review_slot_id', sa.Integer(), nullable=False),
        sa.Column('reviewer_id', sa.Integer(), nullable=False),
        sa.Column('requester_id', sa.Integer(), nullable=False),
        sa.Column('clarity_rating', sa.Integer(), nullable=False),
        sa.Column('responsiveness_rating', sa.Integer(), nullable=False),
        sa.Column('fairness_rating', sa.Integer(), nullable=False),
        sa.Column('overall_rating', sa.Integer(), nullable=False),
        sa.Column('feedback_text', sa.Text(), nullable=True),
        sa.Column('is_anonymous', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['review_slot_id'], ['review_slots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_requester_ratings_id'), 'requester_ratings', ['id'], unique=False)
    op.create_index(op.f('ix_requester_ratings_review_slot_id'), 'requester_ratings', ['review_slot_id'], unique=True)
    op.create_index(op.f('ix_requester_ratings_reviewer_id'), 'requester_ratings', ['reviewer_id'], unique=False)
    op.create_index(op.f('ix_requester_ratings_requester_id'), 'requester_ratings', ['requester_id'], unique=False)
    op.create_index(op.f('ix_requester_ratings_created_at'), 'requester_ratings', ['created_at'], unique=False)

    # ============= REQUESTER_STATS TABLE =============
    op.create_table(
        'requester_stats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('avg_clarity', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('avg_responsiveness', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('avg_fairness', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('avg_overall', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('total_ratings', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_reviews_requested', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_response_hours', sa.Integer(), nullable=True),
        sa.Column('reviews_without_feedback', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_responsive', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('is_fair', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_requester_stats_id'), 'requester_stats', ['id'], unique=False)
    op.create_index(op.f('ix_requester_stats_user_id'), 'requester_stats', ['user_id'], unique=True)


def downgrade() -> None:
    # Drop requester_stats table
    op.drop_index(op.f('ix_requester_stats_user_id'), table_name='requester_stats')
    op.drop_index(op.f('ix_requester_stats_id'), table_name='requester_stats')
    op.drop_table('requester_stats')

    # Drop requester_ratings table
    op.drop_index(op.f('ix_requester_ratings_created_at'), table_name='requester_ratings')
    op.drop_index(op.f('ix_requester_ratings_requester_id'), table_name='requester_ratings')
    op.drop_index(op.f('ix_requester_ratings_reviewer_id'), table_name='requester_ratings')
    op.drop_index(op.f('ix_requester_ratings_review_slot_id'), table_name='requester_ratings')
    op.drop_index(op.f('ix_requester_ratings_id'), table_name='requester_ratings')
    op.drop_table('requester_ratings')

    # Drop leaderboard_entries table
    op.drop_index(op.f('ix_leaderboard_entries_rank'), table_name='leaderboard_entries')
    op.drop_index(op.f('ix_leaderboard_entries_score'), table_name='leaderboard_entries')
    op.drop_index(op.f('ix_leaderboard_entries_skill'), table_name='leaderboard_entries')
    op.drop_index(op.f('ix_leaderboard_entries_category'), table_name='leaderboard_entries')
    op.drop_index(op.f('ix_leaderboard_entries_season_id'), table_name='leaderboard_entries')
    op.drop_index(op.f('ix_leaderboard_entries_user_id'), table_name='leaderboard_entries')
    op.drop_index(op.f('ix_leaderboard_entries_id'), table_name='leaderboard_entries')
    op.drop_table('leaderboard_entries')

    # Drop seasons table
    op.drop_index(op.f('ix_seasons_is_active'), table_name='seasons')
    op.drop_index(op.f('ix_seasons_end_date'), table_name='seasons')
    op.drop_index(op.f('ix_seasons_start_date'), table_name='seasons')
    op.drop_index(op.f('ix_seasons_season_type'), table_name='seasons')
    op.drop_index(op.f('ix_seasons_id'), table_name='seasons')
    op.drop_table('seasons')

    # Drop user_badges table
    op.drop_index(op.f('ix_user_badges_earned_at'), table_name='user_badges')
    op.drop_index(op.f('ix_user_badges_badge_id'), table_name='user_badges')
    op.drop_index(op.f('ix_user_badges_user_id'), table_name='user_badges')
    op.drop_index(op.f('ix_user_badges_id'), table_name='user_badges')
    op.drop_table('user_badges')

    # Drop badges table
    op.drop_index(op.f('ix_badges_category'), table_name='badges')
    op.drop_index(op.f('ix_badges_code'), table_name='badges')
    op.drop_index(op.f('ix_badges_id'), table_name='badges')
    op.drop_table('badges')

    # Drop user xp index
    op.drop_index(op.f('ix_users_xp_points'), table_name='users')

    # Drop user columns
    op.drop_column('users', 'week_start_date')
    op.drop_column('users', 'weekly_goal_streak')
    op.drop_column('users', 'weekly_goal_target')
    op.drop_column('users', 'weekly_reviews_count')
    op.drop_column('users', 'penalty_multiplier')
    op.drop_column('users', 'last_warning_at')
    op.drop_column('users', 'warning_count')
    op.drop_column('users', 'streak_protected_until')
    op.drop_column('users', 'streak_shield_used_at')
    op.drop_column('users', 'streak_shield_count')
    op.drop_column('users', 'reputation_percentile')
    op.drop_column('users', 'last_active_date')
    op.drop_column('users', 'reputation_score')
    op.drop_column('users', 'xp_points')
