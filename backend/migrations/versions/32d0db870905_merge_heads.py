"""merge_heads

Revision ID: 32d0db870905
Revises: fix_enum_data_conversion, update_billing_frequency_enum
Create Date: 2025-05-12 12:41:50.350726

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "32d0db870905"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Add the two heads that this revision merges
parents = ("fix_enum_data_conversion", "update_billing_frequency_enum")


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
