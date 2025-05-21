"""a7b9c8d6e5f4

Revision ID: fedd8002964a
Revises: a7b9c8d6e5f4, b22b835bf633
Create Date: 2025-05-20 23:36:27.849769

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fedd8002964a'
down_revision: Union[str, None] = ('a7b9c8d6e5f4', 'b22b835bf633')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
