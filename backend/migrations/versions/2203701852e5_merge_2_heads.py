"""merge 2 heads

Revision ID: 2203701852e5
Revises: add_pomodoro_tables, add_task_models
Create Date: 2025-05-19 22:06:39.311361

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2203701852e5'
down_revision: Union[str, None] = ('add_pomodoro_tables', 'add_task_models')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
