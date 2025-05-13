"""Merge multiple heads

Revision ID: 793a099393e3
Revises: 32d0db870905, add_ai_insights_tables, fix_enum_data_conversion, update_billing_frequency_enum
Create Date: 2025-05-12 16:38:17.501194

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '793a099393e3'
down_revision: Union[str, None] = ('32d0db870905', 'add_ai_insights_tables', 'fix_enum_data_conversion', 'update_billing_frequency_enum')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
