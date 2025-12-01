"""Add battles system: prompts, battles, entries, votes, challenges

Revision ID: add_battles_001
Revises: e61fd77e2cca
Create Date: 2025-12-01

This migration adds the complete battles system:
- Battle prompts (curated challenges)
- Battles (1v1 competitions)
- Battle entries (participant submissions)
- Battle votes (community voting)
- Battle challenges (direct challenge invitations)
- User battle stats
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_battles_001'
down_revision = 'e61fd77e2cca'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ============= BATTLE_PROMPTS TABLE =============
    op.create_table(
        'battle_prompts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('content_type', sa.String(20), nullable=False),  # design, code, video, etc.
        sa.Column('difficulty', sa.String(20), nullable=False, server_default='intermediate'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('times_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_battle_prompts_id'), 'battle_prompts', ['id'], unique=False)
    op.create_index(op.f('ix_battle_prompts_content_type'), 'battle_prompts', ['content_type'], unique=False)
    op.create_index(op.f('ix_battle_prompts_difficulty'), 'battle_prompts', ['difficulty'], unique=False)
    op.create_index(op.f('ix_battle_prompts_is_active'), 'battle_prompts', ['is_active'], unique=False)

    # ============= BATTLES TABLE =============
    op.create_table(
        'battles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content_type', sa.String(20), nullable=False),
        sa.Column('prompt_id', sa.Integer(), nullable=True),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('opponent_id', sa.Integer(), nullable=True),
        sa.Column('winner_id', sa.Integer(), nullable=True),
        sa.Column('battle_type', sa.String(20), nullable=False, server_default='queue'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('min_tier', sa.String(50), nullable=True),
        sa.Column('max_tier', sa.String(50), nullable=True),
        sa.Column('submission_hours', sa.Integer(), nullable=False, server_default='72'),
        sa.Column('voting_hours', sa.Integer(), nullable=False, server_default='48'),
        sa.Column('submission_deadline', sa.DateTime(), nullable=True),
        sa.Column('voting_deadline', sa.DateTime(), nullable=True),
        sa.Column('creator_votes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('opponent_votes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_votes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('winner_karma_reward', sa.Integer(), nullable=True),
        sa.Column('loser_karma_change', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('voting_started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['prompt_id'], ['battle_prompts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['opponent_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['winner_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_battles_id'), 'battles', ['id'], unique=False)
    op.create_index(op.f('ix_battles_content_type'), 'battles', ['content_type'], unique=False)
    op.create_index(op.f('ix_battles_prompt_id'), 'battles', ['prompt_id'], unique=False)
    op.create_index(op.f('ix_battles_creator_id'), 'battles', ['creator_id'], unique=False)
    op.create_index(op.f('ix_battles_opponent_id'), 'battles', ['opponent_id'], unique=False)
    op.create_index(op.f('ix_battles_status'), 'battles', ['status'], unique=False)
    op.create_index(op.f('ix_battles_deleted_at'), 'battles', ['deleted_at'], unique=False)
    op.create_index('idx_battle_status_content', 'battles', ['status', 'content_type'], unique=False)
    op.create_index('idx_battle_creator_status', 'battles', ['creator_id', 'status'], unique=False)
    op.create_index('idx_battle_opponent_status', 'battles', ['opponent_id', 'status'], unique=False)
    op.create_index('idx_battle_status_created', 'battles', ['status', 'created_at'], unique=False)
    op.create_index('idx_battle_pending_content', 'battles', ['status', 'content_type', 'prompt_id'], unique=False)

    # ============= BATTLE_ENTRIES TABLE =============
    op.create_table(
        'battle_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('battle_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_urls', sa.JSON(), nullable=True),
        sa.Column('external_links', sa.JSON(), nullable=True),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('vote_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['battle_id'], ['battles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_battle_entries_id'), 'battle_entries', ['id'], unique=False)
    op.create_index(op.f('ix_battle_entries_battle_id'), 'battle_entries', ['battle_id'], unique=False)
    op.create_index(op.f('ix_battle_entries_user_id'), 'battle_entries', ['user_id'], unique=False)

    # ============= BATTLE_VOTES TABLE =============
    op.create_table(
        'battle_votes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('battle_id', sa.Integer(), nullable=False),
        sa.Column('voter_id', sa.Integer(), nullable=False),
        sa.Column('entry_id', sa.Integer(), nullable=False),
        sa.Column('voted_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['battle_id'], ['battles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['voter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['entry_id'], ['battle_entries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('battle_id', 'voter_id', name='unique_battle_voter')
    )
    op.create_index(op.f('ix_battle_votes_id'), 'battle_votes', ['id'], unique=False)
    op.create_index(op.f('ix_battle_votes_battle_id'), 'battle_votes', ['battle_id'], unique=False)
    op.create_index(op.f('ix_battle_votes_voter_id'), 'battle_votes', ['voter_id'], unique=False)
    op.create_index(op.f('ix_battle_votes_entry_id'), 'battle_votes', ['entry_id'], unique=False)

    # ============= BATTLE_CHALLENGES TABLE =============
    op.create_table(
        'battle_challenges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('battle_id', sa.Integer(), nullable=False),
        sa.Column('challenger_id', sa.Integer(), nullable=False),
        sa.Column('challenged_id', sa.Integer(), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['battle_id'], ['battles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['challenger_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['challenged_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('battle_id', name='unique_battle_challenge')
    )
    op.create_index(op.f('ix_battle_challenges_id'), 'battle_challenges', ['id'], unique=False)
    op.create_index(op.f('ix_battle_challenges_battle_id'), 'battle_challenges', ['battle_id'], unique=False)
    op.create_index(op.f('ix_battle_challenges_challenger_id'), 'battle_challenges', ['challenger_id'], unique=False)
    op.create_index(op.f('ix_battle_challenges_challenged_id'), 'battle_challenges', ['challenged_id'], unique=False)
    op.create_index(op.f('ix_battle_challenges_status'), 'battle_challenges', ['status'], unique=False)

    # ============= USER BATTLE STATS =============
    op.add_column('users', sa.Column('battles_won', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('battles_lost', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('battles_drawn', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('battle_win_streak', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('best_battle_streak', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    # Drop user battle stat columns
    op.drop_column('users', 'best_battle_streak')
    op.drop_column('users', 'battle_win_streak')
    op.drop_column('users', 'battles_drawn')
    op.drop_column('users', 'battles_lost')
    op.drop_column('users', 'battles_won')

    # Drop battle_challenges table
    op.drop_index(op.f('ix_battle_challenges_status'), table_name='battle_challenges')
    op.drop_index(op.f('ix_battle_challenges_challenged_id'), table_name='battle_challenges')
    op.drop_index(op.f('ix_battle_challenges_challenger_id'), table_name='battle_challenges')
    op.drop_index(op.f('ix_battle_challenges_battle_id'), table_name='battle_challenges')
    op.drop_index(op.f('ix_battle_challenges_id'), table_name='battle_challenges')
    op.drop_table('battle_challenges')

    # Drop battle_votes table
    op.drop_index(op.f('ix_battle_votes_entry_id'), table_name='battle_votes')
    op.drop_index(op.f('ix_battle_votes_voter_id'), table_name='battle_votes')
    op.drop_index(op.f('ix_battle_votes_battle_id'), table_name='battle_votes')
    op.drop_index(op.f('ix_battle_votes_id'), table_name='battle_votes')
    op.drop_table('battle_votes')

    # Drop battle_entries table
    op.drop_index(op.f('ix_battle_entries_user_id'), table_name='battle_entries')
    op.drop_index(op.f('ix_battle_entries_battle_id'), table_name='battle_entries')
    op.drop_index(op.f('ix_battle_entries_id'), table_name='battle_entries')
    op.drop_table('battle_entries')

    # Drop battles table
    op.drop_index('idx_battle_pending_content', table_name='battles')
    op.drop_index('idx_battle_status_created', table_name='battles')
    op.drop_index('idx_battle_opponent_status', table_name='battles')
    op.drop_index('idx_battle_creator_status', table_name='battles')
    op.drop_index('idx_battle_status_content', table_name='battles')
    op.drop_index(op.f('ix_battles_deleted_at'), table_name='battles')
    op.drop_index(op.f('ix_battles_status'), table_name='battles')
    op.drop_index(op.f('ix_battles_opponent_id'), table_name='battles')
    op.drop_index(op.f('ix_battles_creator_id'), table_name='battles')
    op.drop_index(op.f('ix_battles_prompt_id'), table_name='battles')
    op.drop_index(op.f('ix_battles_content_type'), table_name='battles')
    op.drop_index(op.f('ix_battles_id'), table_name='battles')
    op.drop_table('battles')

    # Drop battle_prompts table
    op.drop_index(op.f('ix_battle_prompts_is_active'), table_name='battle_prompts')
    op.drop_index(op.f('ix_battle_prompts_difficulty'), table_name='battle_prompts')
    op.drop_index(op.f('ix_battle_prompts_content_type'), table_name='battle_prompts')
    op.drop_index(op.f('ix_battle_prompts_id'), table_name='battle_prompts')
    op.drop_table('battle_prompts')
