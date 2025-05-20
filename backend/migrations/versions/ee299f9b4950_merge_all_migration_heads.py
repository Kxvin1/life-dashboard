"""merge_all_migration_heads

Revision ID: ee299f9b4950
Revises: add_pomodoro_tables, add_task_models
Create Date: 2025-05-19 23:24:58.829687

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee299f9b4950'
down_revision: Union[str, None] = ('add_pomodoro_tables', 'add_task_models')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
