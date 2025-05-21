"""merge heads

Revision ID: a7b9c8d6e5f4
Revises: 00ec43f29f42, 9a7b3c5d1e2f
Create Date: 2023-11-15 12:00:00.000000

"""

# revision identifiers, used by Alembic.
revision = "a7b9c8d6e5f4"
down_revision = None
branch_labels = None
depends_on = None

# This is a merge migration - it doesn't contain any upgrade or downgrade operations
# It just connects two separate branches in the migration history

def upgrade():
    pass

def downgrade():
    pass
