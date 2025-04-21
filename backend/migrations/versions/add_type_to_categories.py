"""Add type column to categories

Revision ID: add_type_to_categories
Revises: update_enum_values_to_lowercase
Create Date: 2025-04-21 03:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from app.models.transaction import TransactionType


# revision identifiers, used by Alembic.
revision: str = 'add_type_to_categories'
down_revision: str = 'update_enum_values_to_lowercase'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the type column to categories table
    op.add_column('categories', sa.Column('type', sa.Enum('income', 'expense', name='transactiontype'), nullable=True))
    
    # Update existing categories to have a default type
    op.execute("UPDATE categories SET type = 'expense' WHERE type IS NULL")
    
    # Make the column non-nullable after setting default values
    op.alter_column('categories', 'type', nullable=False)


def downgrade() -> None:
    # Remove the type column
    op.drop_column('categories', 'type') 