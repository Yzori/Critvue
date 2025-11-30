"""merge_heads

Revision ID: 299ccc3e31d8
Revises: nda_support_001, n7o8p9q0r1s2
Create Date: 2025-11-30 14:20:37.109092

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '299ccc3e31d8'
down_revision: Union[str, None] = ('nda_support_001', 'n7o8p9q0r1s2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
