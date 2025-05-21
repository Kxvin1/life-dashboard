"""a7b9c8d6e5f4

Revision ID: b22b835bf633
Revises: 00ec43f29f42, 9a7b3c5d1e2f
Create Date: 2025-05-20 23:33:56.241558

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b22b835bf633'
down_revision: Union[str, None] = ('00ec43f29f42', '9a7b3c5d1e2f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
