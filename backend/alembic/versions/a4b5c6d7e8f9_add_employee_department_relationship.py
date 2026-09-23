"""Add employee department relationship.

Revision ID: a4b5c6d7e8f9
Revises: f2a3b4c5d6e7
Create Date: 2026-09-23

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "a4b5c6d7e8f9"
down_revision: str | None = "f2a3b4c5d6e7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "employees",
        sa.Column("department_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_employees_department_id_departments",
        "employees",
        "departments",
        ["department_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_employees_department_id"),
        "employees",
        ["department_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_employees_department_id"), table_name="employees")
    op.drop_constraint(
        "fk_employees_department_id_departments",
        "employees",
        type_="foreignkey",
    )
    op.drop_column("employees", "department_id")
