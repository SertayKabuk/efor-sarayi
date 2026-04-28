"""Drop stored effort_person_days from projects

Revision ID: 006
Revises: 005
Create Date: 2026-04-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("projects", "effort_person_days")


def downgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("effort_person_days", sa.Integer(), nullable=False, server_default="0"),
    )