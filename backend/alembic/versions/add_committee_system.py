"""Add committee system for expert application review

Revision ID: committee_system_001
Revises: reviewer_dna_001
Create Date: 2024-11-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'committee_system_001'
down_revision: Union[str, None] = 'reviewer_dna_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create committee system tables and update expert_applications."""

    # 1. Create committee_members table
    op.create_table(
        'committee_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='senior_reviewer'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('max_concurrent_reviews', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('deactivated_at', sa.DateTime(), nullable=True),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', name='uq_committee_member_user_id'),
    )

    op.create_index('idx_committee_active_role', 'committee_members', ['is_active', 'role'])
    op.create_index('idx_committee_user_id', 'committee_members', ['user_id'])

    # 2. Create rejection_reasons table
    op.create_table(
        'rejection_reasons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('label', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('applicant_message', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),

        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code', name='uq_rejection_reason_code'),
    )

    op.create_index('idx_rejection_reason_code', 'rejection_reasons', ['code'])
    op.create_index('idx_rejection_reason_active', 'rejection_reasons', ['is_active'])

    # 3. Create application_reviews table
    op.create_table(
        'application_reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=False),
        sa.Column('reviewer_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='claimed'),
        sa.Column('vote', sa.String(50), nullable=True),
        sa.Column('rejection_reason_id', sa.Integer(), nullable=True),
        sa.Column('additional_feedback', sa.Text(), nullable=True),
        sa.Column('internal_notes', sa.Text(), nullable=True),
        sa.Column('claimed_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('voted_at', sa.DateTime(), nullable=True),
        sa.Column('released_at', sa.DateTime(), nullable=True),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['application_id'], ['expert_applications.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['committee_members.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rejection_reason_id'], ['rejection_reasons.id'], ondelete='SET NULL'),
    )

    op.create_index('idx_app_review_application', 'application_reviews', ['application_id'])
    op.create_index('idx_app_review_reviewer', 'application_reviews', ['reviewer_id'])
    op.create_index('idx_app_review_status', 'application_reviews', ['status'])
    op.create_index('idx_app_review_app_status', 'application_reviews', ['application_id', 'status'])
    op.create_index('idx_app_review_reviewer_status', 'application_reviews', ['reviewer_id', 'status'])
    op.create_index('idx_app_review_claimed_at', 'application_reviews', ['claimed_at'])

    # 4. Add new columns to expert_applications table
    op.add_column('expert_applications', sa.Column('decided_at', sa.DateTime(), nullable=True))
    op.add_column('expert_applications', sa.Column('last_rejection_at', sa.DateTime(), nullable=True))
    op.add_column('expert_applications', sa.Column('rejection_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('expert_applications', sa.Column('assigned_tier', sa.String(50), nullable=True))
    op.add_column('expert_applications', sa.Column('rejection_summary', sa.Text(), nullable=True))

    # 5. Seed initial rejection reasons
    op.execute("""
        INSERT INTO rejection_reasons (code, label, description, applicant_message, is_active, display_order) VALUES
        ('INSUFFICIENT_EXPERIENCE', 'Insufficient Experience',
         'Applicant does not have enough relevant experience in their claimed area of expertise.',
         'We require more demonstrated experience in your area of expertise. Please continue building your portfolio and reapply in 3 months.',
         1, 1),
        ('POOR_PORTFOLIO_QUALITY', 'Poor Portfolio Quality',
         'The submitted portfolio samples do not meet our quality standards.',
         'The portfolio samples provided did not meet our quality standards. Please include higher quality work samples when reapplying.',
         1, 2),
        ('POOR_SAMPLE_REVIEW', 'Poor Sample Review',
         'The sample review did not demonstrate the expected level of feedback quality.',
         'Your sample review did not demonstrate the depth and quality of feedback we expect from our reviewers. Consider studying our review guidelines before reapplying.',
         1, 3),
        ('INCOMPLETE_APPLICATION', 'Incomplete Application',
         'The application was missing required information or sections.',
         'Your application was incomplete. Please ensure all required sections are filled out when reapplying.',
         1, 4),
        ('MISMATCHED_SKILLS', 'Mismatched Skills',
         'The claimed skills do not align with the portfolio or experience provided.',
         'We noticed inconsistencies between your claimed expertise and the work samples provided. Please ensure your application accurately reflects your skills.',
         1, 5),
        ('DUPLICATE_APPLICATION', 'Duplicate Application',
         'Applicant has another active or recently rejected application.',
         'You have an existing application or recently submitted one. Please wait for the cooldown period before reapplying.',
         1, 6),
        ('POLICY_VIOLATION', 'Policy Violation',
         'Application contains content that violates our community policies.',
         'Your application contained content that violates our community policies. Please review our guidelines before reapplying.',
         1, 7),
        ('OTHER', 'Other',
         'Rejection reason not covered by standard categories.',
         'Your application was not approved at this time. Please review the feedback provided and consider reapplying in 3 months.',
         1, 99)
    """)


def downgrade() -> None:
    """Remove committee system tables and expert_applications columns."""

    # Remove columns from expert_applications
    op.drop_column('expert_applications', 'rejection_summary')
    op.drop_column('expert_applications', 'assigned_tier')
    op.drop_column('expert_applications', 'rejection_count')
    op.drop_column('expert_applications', 'last_rejection_at')
    op.drop_column('expert_applications', 'decided_at')

    # Drop application_reviews table
    op.drop_index('idx_app_review_claimed_at', table_name='application_reviews')
    op.drop_index('idx_app_review_reviewer_status', table_name='application_reviews')
    op.drop_index('idx_app_review_app_status', table_name='application_reviews')
    op.drop_index('idx_app_review_status', table_name='application_reviews')
    op.drop_index('idx_app_review_reviewer', table_name='application_reviews')
    op.drop_index('idx_app_review_application', table_name='application_reviews')
    op.drop_table('application_reviews')

    # Drop rejection_reasons table
    op.drop_index('idx_rejection_reason_active', table_name='rejection_reasons')
    op.drop_index('idx_rejection_reason_code', table_name='rejection_reasons')
    op.drop_table('rejection_reasons')

    # Drop committee_members table
    op.drop_index('idx_committee_user_id', table_name='committee_members')
    op.drop_index('idx_committee_active_role', table_name='committee_members')
    op.drop_table('committee_members')
