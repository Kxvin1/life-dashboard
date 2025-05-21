"""Add indexes to task and task_category tables

Revision ID: 9a7b3c5d1e2f
Revises: add_task_models
Create Date: 2023-11-15 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9a7b3c5d1e2f"
down_revision = "add_task_models"
branch_labels = None
depends_on = None


def upgrade():
    # Add indexes to tasks table - with safety checks
    from sqlalchemy.exc import ProgrammingError

    # Helper function to safely create an index
    def safe_create_index(index_name, table_name, columns, unique=False):
        try:
            op.create_index(op.f(index_name), table_name, columns, unique=unique)
            print(f"Created index {index_name} on {table_name}")
        except ProgrammingError as e:
            if "already exists" in str(e):
                print(f"Index {index_name} already exists on {table_name}")
            else:
                raise

    # Tasks table indexes
    safe_create_index("ix_tasks_user_id", "tasks", ["user_id"])
    safe_create_index("ix_tasks_due_date", "tasks", ["due_date"])
    safe_create_index("ix_tasks_status", "tasks", ["status"])
    safe_create_index("ix_tasks_priority", "tasks", ["priority"])
    safe_create_index("ix_tasks_category_id", "tasks", ["category_id"])
    safe_create_index("ix_tasks_parent_task_id", "tasks", ["parent_task_id"])
    safe_create_index("ix_tasks_is_long_term", "tasks", ["is_long_term"])
    safe_create_index("ix_tasks_created_at", "tasks", ["created_at"])

    # Task categories table indexes
    safe_create_index("ix_task_categories_user_id", "task_categories", ["user_id"])
    safe_create_index("ix_task_categories_name", "task_categories", ["name"])
    safe_create_index(
        "ix_task_categories_is_default", "task_categories", ["is_default"]
    )


def downgrade():
    # Remove indexes from tasks table - with safety checks
    from sqlalchemy.exc import ProgrammingError

    # Helper function to safely drop an index
    def safe_drop_index(index_name, table_name):
        try:
            op.drop_index(op.f(index_name), table_name=table_name)
            print(f"Dropped index {index_name} from {table_name}")
        except ProgrammingError as e:
            if "does not exist" in str(e):
                print(f"Index {index_name} does not exist on {table_name}")
            else:
                raise

    # Tasks table indexes
    safe_drop_index("ix_tasks_user_id", "tasks")
    safe_drop_index("ix_tasks_due_date", "tasks")
    safe_drop_index("ix_tasks_status", "tasks")
    safe_drop_index("ix_tasks_priority", "tasks")
    safe_drop_index("ix_tasks_category_id", "tasks")
    safe_drop_index("ix_tasks_parent_task_id", "tasks")
    safe_drop_index("ix_tasks_is_long_term", "tasks")
    safe_drop_index("ix_tasks_created_at", "tasks")

    # Task categories table indexes
    safe_drop_index("ix_task_categories_user_id", "task_categories")
    safe_drop_index("ix_task_categories_name", "task_categories")
    safe_drop_index("ix_task_categories_is_default", "task_categories")
