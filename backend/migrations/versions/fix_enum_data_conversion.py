"""Fix category types

Revision ID: fix_enum_data_conversion
Revises: update_enum_values_to_lowercase
Create Date: 2025-04-21 04:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_enum_data_conversion'
down_revision: str = 'update_enum_values_to_lowercase'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, ensure all categories are set to expense
    op.execute("UPDATE categories SET type = 'expense'")
    
    # Then, set the income categories
    op.execute("""
        UPDATE categories 
        SET type = 'income' 
        WHERE name IN ('Employment', 'Business', 'Investment', 'Rental', 'Other')
    """)


def downgrade() -> None:
    # Revert all categories back to expense
    op.execute("UPDATE categories SET type = 'expense'") 