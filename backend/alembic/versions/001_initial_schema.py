"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("tech_stack", sa.ARRAY(sa.String), nullable=False),
        sa.Column("team_size", sa.Integer, nullable=False),
        sa.Column("duration_days", sa.Integer, nullable=False),
        sa.Column("complexity", sa.String(20), nullable=False),
        sa.Column("actual_effort", sa.Float, nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_projects_complexity", "projects", ["complexity"])


def downgrade() -> None:
    op.drop_index("idx_projects_complexity")
    op.drop_table("projects")
