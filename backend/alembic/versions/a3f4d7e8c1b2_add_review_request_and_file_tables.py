"""Add review request and file tables

Revision ID: a3f4d7e8c1b2
Revises: 121d28234ca3
Create Date: 2025-11-11 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f4d7e8c1b2'
down_revision: Union[str, None] = '121d28234ca3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create review_requests and review_files tables"""

    # Note: SQLite doesn't support CREATE TYPE for enums
    # SQLAlchemy will handle enums as VARCHAR with CHECK constraints

    # Create review_requests table
    op.create_table(
        'review_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('content_type', sa.Enum(
            'design', 'code', 'video', 'audio', 'writing', 'art',
            name='contenttype'
        ), nullable=False),
        sa.Column('review_type', sa.Enum(
            'free', 'expert',
            name='reviewtype'
        ), nullable=False),
        sa.Column('status', sa.Enum(
            'draft', 'pending', 'in_review', 'completed', 'cancelled',
            name='reviewstatus'
        ), nullable=False),
        sa.Column('feedback_areas', sa.Text(), nullable=True),
        sa.Column('budget', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for review_requests
    op.create_index(op.f('ix_review_requests_id'), 'review_requests', ['id'], unique=False)
    op.create_index(op.f('ix_review_requests_user_id'), 'review_requests', ['user_id'], unique=False)
    op.create_index(op.f('ix_review_requests_content_type'), 'review_requests', ['content_type'], unique=False)
    op.create_index(op.f('ix_review_requests_status'), 'review_requests', ['status'], unique=False)
    op.create_index(op.f('ix_review_requests_deleted_at'), 'review_requests', ['deleted_at'], unique=False)

    # Create review_files table
    op.create_table(
        'review_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('review_request_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=False),
        sa.Column('file_url', sa.String(length=1000), nullable=True),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('content_hash', sa.String(length=64), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['review_request_id'], ['review_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for review_files
    op.create_index(op.f('ix_review_files_id'), 'review_files', ['id'], unique=False)
    op.create_index(op.f('ix_review_files_review_request_id'), 'review_files', ['review_request_id'], unique=False)


def downgrade() -> None:
    """Drop review_requests and review_files tables"""

    # Drop review_files table and indexes
    op.drop_index(op.f('ix_review_files_review_request_id'), table_name='review_files')
    op.drop_index(op.f('ix_review_files_id'), table_name='review_files')
    op.drop_table('review_files')

    # Drop review_requests table and indexes
    op.drop_index(op.f('ix_review_requests_deleted_at'), table_name='review_requests')
    op.drop_index(op.f('ix_review_requests_status'), table_name='review_requests')
    op.drop_index(op.f('ix_review_requests_content_type'), table_name='review_requests')
    op.drop_index(op.f('ix_review_requests_user_id'), table_name='review_requests')
    op.drop_index(op.f('ix_review_requests_id'), table_name='review_requests')
    op.drop_table('review_requests')

    # Note: No need to drop enums in SQLite (they're handled as VARCHAR)
