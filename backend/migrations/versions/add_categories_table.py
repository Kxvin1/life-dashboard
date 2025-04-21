"""add categories table

Revision ID: add_categories_table
Revises: 168d99495baf
Create Date: 2024-04-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'add_categories_table'
down_revision = '168d99495baf'
branch_labels = None
depends_on = None

def upgrade():
    # Create enum type for transaction type if it doesn't exist
    connection = op.get_bind()
    result = connection.execute(text(
        "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type')"
    )).scalar()
    
    if not result:
        op.execute(text("CREATE TYPE transaction_type AS ENUM ('income', 'expense')"))
    
    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', postgresql.ENUM('income', 'expense', name='transaction_type', create_type=False), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')
    # Don't drop the enum type as it might be used by other tables 