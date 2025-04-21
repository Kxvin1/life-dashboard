"""add category_id to transactions

Revision ID: add_category_id_to_transactions
Revises: add_categories_table
Create Date: 2024-04-20 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_category_id_to_transactions'
down_revision = 'add_categories_table'
branch_labels = None
depends_on = None

def upgrade():
    # Add category_id column to transactions table
    op.add_column('transactions',
        sa.Column('category_id', sa.Integer(), nullable=True)
    )
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_transaction_category',
        'transactions',
        'categories',
        ['category_id'],
        ['id']
    )

def downgrade():
    # Drop foreign key constraint first
    op.drop_constraint('fk_transaction_category', 'transactions', type_='foreignkey')
    
    # Drop category_id column
    op.drop_column('transactions', 'category_id') 