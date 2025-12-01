"""Add challenges system

Revision ID: add_challenges_001
Revises:
Create Date: 2024-12-01

This migration adds the complete challenges system matching the models.
"""

from alembic import op
import sqlalchemy as sa


revision = 'add_challenges_001'
down_revision = None
branch_labels = ('challenges',)
depends_on = None


def upgrade() -> None:
    # Note: User columns were already renamed from battles_* to challenges_* in a previous run
    # Skip the rename step as it's already done

    # ============= CHALLENGE_PROMPTS TABLE =============
    op.create_table(
        'challenge_prompts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('content_type', sa.String(50), nullable=False),
        sa.Column('difficulty', sa.String(20), nullable=False, server_default='intermediate'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('times_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_challenge_prompts_id', 'challenge_prompts', ['id'])
    op.create_index('ix_challenge_prompts_content_type', 'challenge_prompts', ['content_type'])
    op.create_index('ix_challenge_prompts_is_active', 'challenge_prompts', ['is_active'])

    # ============= CHALLENGES TABLE =============
    op.create_table(
        'challenges',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('challenge_type', sa.String(20), nullable=False),  # one_on_one, category
        sa.Column('content_type', sa.String(50), nullable=False),
        sa.Column('prompt_id', sa.Integer(), sa.ForeignKey('challenge_prompts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),

        # Timing configuration
        sa.Column('submission_hours', sa.Integer(), nullable=False, server_default='72'),
        sa.Column('voting_hours', sa.Integer(), nullable=False, server_default='48'),
        sa.Column('submission_deadline', sa.DateTime(), nullable=True),
        sa.Column('voting_deadline', sa.DateTime(), nullable=True),

        # Category-specific
        sa.Column('max_winners', sa.Integer(), nullable=False, server_default='1'),

        # 1v1 participants
        sa.Column('participant1_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('participant2_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('winner_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),

        # 1v1 vote tracking
        sa.Column('participant1_votes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('participant2_votes', sa.Integer(), nullable=False, server_default='0'),

        # Display/Branding
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('banner_image_url', sa.String(500), nullable=True),
        sa.Column('prize_description', sa.Text(), nullable=True),

        # Stats
        sa.Column('total_votes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_entries', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('winner_karma_reward', sa.Integer(), nullable=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('voting_started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),

        # Admin
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
    )
    op.create_index('ix_challenges_id', 'challenges', ['id'])
    op.create_index('ix_challenges_status', 'challenges', ['status'])
    op.create_index('ix_challenges_challenge_type', 'challenges', ['challenge_type'])
    op.create_index('ix_challenges_content_type', 'challenges', ['content_type'])
    op.create_index('ix_challenges_is_featured', 'challenges', ['is_featured'])
    op.create_index('ix_challenges_prompt_id', 'challenges', ['prompt_id'])
    op.create_index('idx_challenge_status_type', 'challenges', ['status', 'challenge_type'])
    op.create_index('idx_challenge_status_content', 'challenges', ['status', 'content_type'])

    # ============= CHALLENGE_ENTRIES TABLE =============
    op.create_table(
        'challenge_entries',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('challenge_id', sa.Integer(), sa.ForeignKey('challenges.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('submission_url', sa.String(500), nullable=True),
        sa.Column('submission_data', sa.Text(), nullable=True),  # JSON
        sa.Column('vote_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_winner', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('placement', sa.Integer(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        # Unique: one entry per user per challenge
        sa.UniqueConstraint('user_id', 'challenge_id', name='uq_challenge_entries_user_challenge'),
    )
    op.create_index('ix_challenge_entries_id', 'challenge_entries', ['id'])
    op.create_index('ix_challenge_entries_challenge_id', 'challenge_entries', ['challenge_id'])
    op.create_index('ix_challenge_entries_user_id', 'challenge_entries', ['user_id'])

    # ============= CHALLENGE_VOTES TABLE =============
    op.create_table(
        'challenge_votes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('challenge_id', sa.Integer(), sa.ForeignKey('challenges.id', ondelete='CASCADE'), nullable=False),
        sa.Column('entry_id', sa.Integer(), sa.ForeignKey('challenge_entries.id', ondelete='CASCADE'), nullable=True),
        sa.Column('voter_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        # For 1v1: which participant was voted for (1 or 2)
        sa.Column('voted_for_participant', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        # Unique constraint: one vote per user per challenge
        sa.UniqueConstraint('voter_id', 'challenge_id', name='uq_challenge_votes_voter_challenge'),
    )
    op.create_index('ix_challenge_votes_id', 'challenge_votes', ['id'])
    op.create_index('ix_challenge_votes_challenge_id', 'challenge_votes', ['challenge_id'])
    op.create_index('ix_challenge_votes_entry_id', 'challenge_votes', ['entry_id'])
    op.create_index('ix_challenge_votes_voter_id', 'challenge_votes', ['voter_id'])

    # ============= CHALLENGE_INVITATIONS TABLE =============
    op.create_table(
        'challenge_invitations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('challenge_id', sa.Integer(), sa.ForeignKey('challenges.id', ondelete='CASCADE'), nullable=False),
        sa.Column('invitee_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('invited_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),  # pending, accepted, declined, expired
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_challenge_invitations_id', 'challenge_invitations', ['id'])
    op.create_index('ix_challenge_invitations_challenge_id', 'challenge_invitations', ['challenge_id'])
    op.create_index('ix_challenge_invitations_invitee_id', 'challenge_invitations', ['invitee_id'])
    op.create_index('ix_challenge_invitations_status', 'challenge_invitations', ['status'])

    # ============= CHALLENGE_PARTICIPANTS TABLE =============
    op.create_table(
        'challenge_participants',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('challenge_id', sa.Integer(), sa.ForeignKey('challenges.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('placement', sa.Integer(), nullable=True),
        sa.Column('karma_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        # Unique constraint: one participation per user per challenge
        sa.UniqueConstraint('user_id', 'challenge_id', name='uq_challenge_participants_user_challenge'),
    )
    op.create_index('ix_challenge_participants_id', 'challenge_participants', ['id'])
    op.create_index('ix_challenge_participants_challenge_id', 'challenge_participants', ['challenge_id'])
    op.create_index('ix_challenge_participants_user_id', 'challenge_participants', ['user_id'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('challenge_participants')
    op.drop_table('challenge_invitations')
    op.drop_table('challenge_votes')
    op.drop_table('challenge_entries')
    op.drop_table('challenges')
    op.drop_table('challenge_prompts')

    # Rename user columns back to battles
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('challenges_won', new_column_name='battles_won')
        batch_op.alter_column('challenges_lost', new_column_name='battles_lost')
        batch_op.alter_column('challenges_drawn', new_column_name='battles_drawn')
        batch_op.alter_column('challenge_win_streak', new_column_name='battle_win_streak')
        batch_op.alter_column('best_challenge_streak', new_column_name='best_battle_streak')
