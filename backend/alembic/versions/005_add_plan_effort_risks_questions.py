"""Add implementation_plan, effort_person_days, team_composition, assumptions, risks, questions

Revision ID: 005
Revises: 004
Create Date: 2026-04-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("effort_person_days", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("projects", sa.Column("implementation_plan", JSON(), nullable=False, server_default="[]"))
    op.add_column("projects", sa.Column("team_composition", sa.ARRAY(sa.String()), nullable=False, server_default="{}"))
    op.add_column("projects", sa.Column("assumptions", sa.ARRAY(sa.String()), nullable=False, server_default="{}"))
    op.add_column("projects", sa.Column("risks", JSON(), nullable=False, server_default="[]"))
    op.add_column("projects", sa.Column("questions", sa.ARRAY(sa.String()), nullable=False, server_default="{}"))


def downgrade() -> None:
    op.drop_column("projects", "questions")
    op.drop_column("projects", "risks")
    op.drop_column("projects", "assumptions")
    op.drop_column("projects", "team_composition")
    op.drop_column("projects", "implementation_plan")
    op.drop_column("projects", "effort_person_days")
