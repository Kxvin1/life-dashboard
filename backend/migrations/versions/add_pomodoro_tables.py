"""add pomodoro tables

Revision ID: add_pomodoro_tables
Revises: add_is_demo_user_field
Create Date: 2024-05-25 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_pomodoro_tables'
down_revision = 'add_is_demo_user_field'
branch_labels = None
depends_on = None

def upgrade():
    # Create pomodoro_sessions table
    op.create_table(
        'pomodoro_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('task_name', sa.String(), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on user_id for faster queries
    op.create_index(op.f('ix_pomodoro_sessions_user_id'), 'pomodoro_sessions', ['user_id'], unique=False)
    
    # Create pomodoro_ai_usage table
    op.create_table(
        'pomodoro_ai_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for pomodoro_ai_usage
    op.create_index(op.f('ix_pomodoro_ai_usage_user_id'), 'pomodoro_ai_usage', ['user_id'], unique=False)
    op.create_index(op.f('ix_pomodoro_ai_usage_date'), 'pomodoro_ai_usage', ['date'], unique=False)
    
    # Create pomodoro_ai_history table
    op.create_table(
        'pomodoro_ai_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('insights', postgresql.JSONB(), nullable=False),
        sa.Column('recommendations', postgresql.JSONB(), nullable=False),
        sa.Column('charts_data', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for pomodoro_ai_history
    op.create_index(op.f('ix_pomodoro_ai_history_user_id'), 'pomodoro_ai_history', ['user_id'], unique=False)

def downgrade():
    # Drop tables and indexes in reverse order
    op.drop_index(op.f('ix_pomodoro_ai_history_user_id'), table_name='pomodoro_ai_history')
    op.drop_table('pomodoro_ai_history')
    
    op.drop_index(op.f('ix_pomodoro_ai_usage_date'), table_name='pomodoro_ai_usage')
    op.drop_index(op.f('ix_pomodoro_ai_usage_user_id'), table_name='pomodoro_ai_usage')
    op.drop_table('pomodoro_ai_usage')
    
    op.drop_index(op.f('ix_pomodoro_sessions_user_id'), table_name='pomodoro_sessions')
    op.drop_table('pomodoro_sessions')
