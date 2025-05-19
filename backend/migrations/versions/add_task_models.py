"""Add task models

Revision ID: add_task_models
Revises: b304347bc3a2
Create Date: 2023-07-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_task_models'
down_revision = 'b304347bc3a2'
branch_labels = None
depends_on = None


def upgrade():
    # Create enum types
    task_status_enum = sa.Enum('not_started', 'in_progress', 'completed', name='taskstatus')
    task_priority_enum = sa.Enum('low', 'medium', 'high', name='taskpriority')
    energy_level_enum = sa.Enum('low', 'medium', 'high', name='energylevel')
    recurring_frequency_enum = sa.Enum('daily', 'weekly', 'monthly', 'custom', name='recurringfrequency')
    
    # Create task_categories table
    op.create_table(
        'task_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_default', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_task_categories_id'), 'task_categories', ['id'], unique=False)
    
    # Create tasks table
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('status', task_status_enum, nullable=False, default='not_started'),
        sa.Column('priority', task_priority_enum, nullable=False, default='medium'),
        sa.Column('energy_level', energy_level_enum, nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('estimated_time_minutes', sa.Integer(), nullable=True),
        sa.Column('is_recurring', sa.Boolean(), default=False),
        sa.Column('recurring_frequency', recurring_frequency_enum, nullable=True),
        sa.Column('parent_task_id', sa.Integer(), nullable=True),
        sa.Column('is_long_term', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['task_categories.id'], ),
        sa.ForeignKeyConstraint(['parent_task_id'], ['tasks.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
    
    # Create task_ai_usage table
    op.create_table(
        'task_ai_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False, default=1),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_task_ai_usage_id'), 'task_ai_usage', ['id'], unique=False)
    op.create_index(op.f('ix_task_ai_usage_date'), 'task_ai_usage', ['date'], unique=False)
    
    # Create task_ai_history table
    op.create_table(
        'task_ai_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('input_text', sa.Text(), nullable=False),
        sa.Column('output_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_task_ai_history_id'), 'task_ai_history', ['id'], unique=False)


def downgrade():
    # Drop tables
    op.drop_table('task_ai_history')
    op.drop_table('task_ai_usage')
    op.drop_table('tasks')
    op.drop_table('task_categories')
    
    # Drop enum types
    op.execute('DROP TYPE taskstatus')
    op.execute('DROP TYPE taskpriority')
    op.execute('DROP TYPE energylevel')
    op.execute('DROP TYPE recurringfrequency')
