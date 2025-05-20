"""Add AI insight history table


Revision ID: 00e60163cdeb
Revises: 793a099393e3
Create Date: 2025-05-12 17:08:42.875551

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "00e60163cdeb"
down_revision: Union[str, None] = "793a099393e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ai_insight_history table
    op.create_table(
        "ai_insight_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("time_period", sa.String(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("insights", postgresql.JSONB(), nullable=False),
        sa.Column("recommendations", postgresql.JSONB(), nullable=False),
        sa.Column("charts_data", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ai_insight_history_id"), "ai_insight_history", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_ai_insight_history_user_id"),
        "ai_insight_history",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    # Drop table
    op.drop_index(
        op.f("ix_ai_insight_history_user_id"), table_name="ai_insight_history"
    )
    op.drop_index(op.f("ix_ai_insight_history_id"), table_name="ai_insight_history")
    op.drop_table("ai_insight_history")
