"""Update enum values to lowercase

Revision ID: update_enum_values_to_lowercase
Revises: add_category_id_to_transactions
Create Date: 2025-04-21 03:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'update_enum_values_to_lowercase'
down_revision: str = 'add_category_id_to_transactions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, convert the existing enum values to text
    op.execute("ALTER TABLE transactions ALTER COLUMN type TYPE text USING type::text")
    op.execute("ALTER TABLE transactions ALTER COLUMN payment_method TYPE text USING payment_method::text")
    
    # Drop the existing enum types
    op.execute('DROP TYPE IF EXISTS transactiontype CASCADE')
    op.execute('DROP TYPE IF EXISTS paymentmethod CASCADE')
    
    # Create new enum types with lowercase values
    op.execute("CREATE TYPE transactiontype AS ENUM ('income', 'expense')")
    op.execute("CREATE TYPE paymentmethod AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'other')")
    
    # Convert the text values to lowercase
    op.execute("UPDATE transactions SET type = LOWER(type)")
    op.execute("UPDATE transactions SET payment_method = LOWER(payment_method)")
    
    # Update the columns to use the new enum types
    op.alter_column('transactions', 'type',
                    type_=sa.Enum('income', 'expense', name='transactiontype'),
                    postgresql_using='type::transactiontype')
    op.alter_column('transactions', 'payment_method',
                    type_=sa.Enum('cash', 'credit_card', 'debit_card', 'bank_transfer', 'other', name='paymentmethod'),
                    postgresql_using='payment_method::paymentmethod')


def downgrade() -> None:
    # First, convert the existing enum values to text
    op.execute("ALTER TABLE transactions ALTER COLUMN type TYPE text USING type::text")
    op.execute("ALTER TABLE transactions ALTER COLUMN payment_method TYPE text USING payment_method::text")
    
    # Drop the lowercase enum types
    op.execute('DROP TYPE IF EXISTS transactiontype CASCADE')
    op.execute('DROP TYPE IF EXISTS paymentmethod CASCADE')
    
    # Recreate the original uppercase enum types
    op.execute("CREATE TYPE transactiontype AS ENUM ('INCOME', 'EXPENSE')")
    op.execute("CREATE TYPE paymentmethod AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'OTHER')")
    
    # Convert the text values to uppercase
    op.execute("UPDATE transactions SET type = UPPER(type)")
    op.execute("UPDATE transactions SET payment_method = UPPER(payment_method)")
    
    # Update the columns to use the uppercase enum types
    op.alter_column('transactions', 'type',
                    type_=sa.Enum('INCOME', 'EXPENSE', name='transactiontype'),
                    postgresql_using='type::transactiontype')
    op.alter_column('transactions', 'payment_method',
                    type_=sa.Enum('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'OTHER', name='paymentmethod'),
                    postgresql_using='payment_method::paymentmethod') 