"""update billing frequency enum

Revision ID: update_billing_frequency_enum
Revises: add_subscriptions_table
Create Date: 2024-05-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'update_billing_frequency_enum'
down_revision = 'add_subscriptions_table'
branch_labels = None
depends_on = None

def upgrade():
    # Create a temporary column with the new enum type
    op.execute("ALTER TYPE billing_frequency RENAME TO billing_frequency_old")
    op.execute("CREATE TYPE billing_frequency AS ENUM ('monthly', 'yearly', 'quarterly', 'weekly')")
    
    # Update the subscriptions table to use the new enum type
    op.execute("ALTER TABLE subscriptions ALTER COLUMN billing_frequency TYPE billing_frequency USING billing_frequency::text::billing_frequency")
    
    # Drop the old enum type
    op.execute("DROP TYPE billing_frequency_old")

def downgrade():
    # Create a temporary column with the old enum type
    op.execute("ALTER TYPE billing_frequency RENAME TO billing_frequency_new")
    op.execute("CREATE TYPE billing_frequency AS ENUM ('monthly', 'yearly', 'quarterly', 'weekly', 'custom')")
    
    # Update the subscriptions table to use the old enum type
    op.execute("ALTER TABLE subscriptions ALTER COLUMN billing_frequency TYPE billing_frequency USING billing_frequency::text::billing_frequency")
    
    # Drop the new enum type
    op.execute("DROP TYPE billing_frequency_new")
