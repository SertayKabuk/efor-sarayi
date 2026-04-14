"""Reshape project model: remove team_size, add modules/integrations/requirements/constraints

Revision ID: 004
Revises: 003
Create Date: 2026-04-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("projects", "team_size")
    op.add_column("projects", sa.Column("modules", sa.ARRAY(sa.String), nullable=False, server_default="{}"))
    op.add_column("projects", sa.Column("integrations", sa.ARRAY(sa.String), nullable=False, server_default="{}"))
    op.add_column("projects", sa.Column("requirements", sa.ARRAY(sa.String), nullable=False, server_default="{}"))
    op.add_column("projects", sa.Column("constraints", sa.ARRAY(sa.String), nullable=False, server_default="{}"))


def downgrade() -> None:
    op.drop_column("projects", "constraints")
    op.drop_column("projects", "requirements")
    op.drop_column("projects", "integrations")
    op.drop_column("projects", "modules")
    op.add_column("projects", sa.Column("team_size", sa.Integer, nullable=False, server_default="1"))
