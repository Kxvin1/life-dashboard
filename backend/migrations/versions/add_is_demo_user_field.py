"""add is_demo_user field to users table

Revision ID: add_is_demo_user_field
Revises: final_merge_all_heads
Create Date: 2023-05-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_is_demo_user_field'
down_revision = 'final_merge_all_heads'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_demo_user column to users table with default value False
    op.add_column('users', sa.Column('is_demo_user', sa.Boolean(), nullable=True, server_default='false'))
    
    # Update existing rows to have is_demo_user=False
    op.execute("UPDATE users SET is_demo_user = false")
    
    # Make the column non-nullable after setting default values
    op.alter_column('users', 'is_demo_user', nullable=False, server_default='false')


def downgrade():
    # Remove is_demo_user column from users table
    op.drop_column('users', 'is_demo_user')
