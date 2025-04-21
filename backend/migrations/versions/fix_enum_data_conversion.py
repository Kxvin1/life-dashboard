"""Fix category types

Revision ID: fix_enum_data_conversion
Revises: add_type_to_categories
Create Date: 2025-04-21 04:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_enum_data_conversion'
down_revision: str = 'add_type_to_categories'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, set all categories to expense
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