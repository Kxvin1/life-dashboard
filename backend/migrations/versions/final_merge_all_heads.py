"""Final merge all heads

Revision ID: final_merge_all_heads
Revises: 3283f502659e, 793a099393e3, 00e60163cdeb, ai_insights_tables
Create Date: 2025-05-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'final_merge_all_heads'
down_revision: Union[str, None] = ('3283f502659e', '793a099393e3', '00e60163cdeb', 'ai_insights_tables')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This is a merge migration, no schema changes needed
    pass


def downgrade() -> None:
    # This is a merge migration, no schema changes needed
    pass
