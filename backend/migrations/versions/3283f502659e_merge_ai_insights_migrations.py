"""Merge AI insights migrations

Revision ID: 3283f502659e
Revises: 00e60163cdeb, ai_insights_tables
Create Date: 2025-05-12 17:09:54.336809

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3283f502659e'
down_revision: Union[str, None] = ('00e60163cdeb', 'ai_insights_tables')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
