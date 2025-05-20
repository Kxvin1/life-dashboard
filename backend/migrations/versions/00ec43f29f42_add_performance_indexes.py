"""add_performance_indexes

Revision ID: 00ec43f29f42
Revises: ee299f9b4950
Create Date: 2025-05-20 00:48:24.663705

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "00ec43f29f42"
down_revision: Union[str, None] = "ee299f9b4950"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add indexes to the most frequently queried columns

    # Transactions table - most important for performance
    op.create_index(
        op.f("ix_transactions_user_id"),
        "transactions",
        ["user_id"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        op.f("ix_transactions_date"),
        "transactions",
        ["date"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        op.f("ix_transactions_user_id_date"),
        "transactions",
        ["user_id", "date"],
        unique=False,
        if_not_exists=True,
    )

    # Tasks table - also important for performance
    op.create_index(
        op.f("ix_tasks_user_id"), "tasks", ["user_id"], unique=False, if_not_exists=True
    )
    op.create_index(
        op.f("ix_tasks_is_long_term"),
        "tasks",
        ["is_long_term"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        op.f("ix_tasks_user_id_is_long_term"),
        "tasks",
        ["user_id", "is_long_term"],
        unique=False,
        if_not_exists=True,
    )

    # Categories table - simple but useful index
    op.create_index(
        op.f("ix_categories_type"),
        "categories",
        ["type"],
        unique=False,
        if_not_exists=True,
    )


def downgrade() -> None:
    # Remove indexes
    op.drop_index(
        op.f("ix_transactions_user_id"), table_name="transactions", if_exists=True
    )
    op.drop_index(
        op.f("ix_transactions_date"), table_name="transactions", if_exists=True
    )
    op.drop_index(
        op.f("ix_transactions_user_id_date"), table_name="transactions", if_exists=True
    )

    op.drop_index(op.f("ix_tasks_user_id"), table_name="tasks", if_exists=True)
    op.drop_index(op.f("ix_tasks_is_long_term"), table_name="tasks", if_exists=True)
    op.drop_index(
        op.f("ix_tasks_user_id_is_long_term"), table_name="tasks", if_exists=True
    )

    op.drop_index(op.f("ix_categories_type"), table_name="categories", if_exists=True)
