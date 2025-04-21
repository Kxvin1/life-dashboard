"""Update enum values to lowercase

Revision ID: update_enum_values_to_lowercase
Revises: add_category_id_to_transactions
Create Date: 2025-04-21 03:44:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'update_enum_values_to_lowercase'
down_revision: str = 'add_category_id_to_transactions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert transaction types to lowercase
    op.execute("UPDATE transactions SET type = LOWER(type)")
    op.execute("UPDATE transactions SET payment_method = LOWER(payment_method)")


def downgrade() -> None:
    # Convert back to uppercase if needed
    op.execute("UPDATE transactions SET type = UPPER(type)")
    op.execute("UPDATE transactions SET payment_method = UPPER(payment_method)") 