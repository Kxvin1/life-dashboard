"""add subscriptions table

Revision ID: add_subscriptions_table
Revises: 168d99495baf
Create Date: 2024-05-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_subscriptions_table'
down_revision = '168d99495baf'
branch_labels = None
depends_on = None

def upgrade():
    # Create enum types for subscription status and billing frequency
    op.execute("CREATE TYPE subscription_status AS ENUM ('active', 'inactive')")
    op.execute("CREATE TYPE billing_frequency AS ENUM ('monthly', 'yearly', 'quarterly', 'weekly', 'custom')")
    
    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('billing_frequency', postgresql.ENUM('monthly', 'yearly', 'quarterly', 'weekly', 'custom', name='billing_frequency', create_type=False), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('status', postgresql.ENUM('active', 'inactive', name='subscription_status', create_type=False), nullable=False, server_default='active'),
        sa.Column('next_payment_date', sa.Date(), nullable=True),
        sa.Column('last_active_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on user_id for faster queries
    op.create_index(op.f('ix_subscriptions_user_id'), 'subscriptions', ['user_id'], unique=False)

def downgrade():
    # Drop the subscriptions table
    op.drop_index(op.f('ix_subscriptions_user_id'), table_name='subscriptions')
    op.drop_table('subscriptions')
    
    # Drop the enum types
    op.execute("DROP TYPE subscription_status")
    op.execute("DROP TYPE billing_frequency")
