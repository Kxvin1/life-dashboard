"""Add AI insights tables

Revision ID: add_ai_insights_tables
Revises: add_subscriptions_table
Create Date: 2025-05-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_ai_insights_tables'
down_revision: Union[str, None] = 'add_subscriptions_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ai_insight_usage table
    op.create_table(
        'ai_insight_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_insight_usage_date'), 'ai_insight_usage', ['date'], unique=False)
    op.create_index(op.f('ix_ai_insight_usage_id'), 'ai_insight_usage', ['id'], unique=False)
    
    # Create system_settings table
    op.create_table(
        'system_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('value', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_settings_id'), 'system_settings', ['id'], unique=False)
    op.create_index(op.f('ix_system_settings_key'), 'system_settings', ['key'], unique=True)
    
    # Add default system settings
    op.execute(
        "INSERT INTO system_settings (key, value, description) VALUES ('default_ai_usage_limit', '3', 'Default daily limit for AI insights usage')"
    )


def downgrade() -> None:
    # Drop tables
    op.drop_index(op.f('ix_system_settings_key'), table_name='system_settings')
    op.drop_index(op.f('ix_system_settings_id'), table_name='system_settings')
    op.drop_table('system_settings')
    
    op.drop_index(op.f('ix_ai_insight_usage_id'), table_name='ai_insight_usage')
    op.drop_index(op.f('ix_ai_insight_usage_date'), table_name='ai_insight_usage')
    op.drop_table('ai_insight_usage')
