"""Create employees table.

Revision ID: d8e4f6a7b9c0
Revises: c3f4a1b2d5e6
Create Date: 2026-09-22

"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy.dialects import postgresql
import sqlalchemy as sa


revision: str = "d8e4f6a7b9c0"
down_revision: str | None = "c3f4a1b2d5e6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


employee_seniority = postgresql.ENUM(
    "JUNIOR",
    "MID",
    "SENIOR",
    "LEAD",
    name="employee_seniority",
    create_type=False,
)


def upgrade() -> None:
    employee_seniority.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "employees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("first_name", sa.String(), nullable=False),
        sa.Column("last_name", sa.String(), nullable=False),
        sa.Column("position", sa.String(), nullable=False),
        sa.Column("seniority", employee_seniority, nullable=False),
        sa.Column("weekly_capacity", sa.Integer(), nullable=False),
        sa.Column(
            "active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.CheckConstraint(
            "length(trim(first_name)) > 0",
            name="ck_employees_first_name_not_blank",
        ),
        sa.CheckConstraint(
            "length(trim(last_name)) > 0",
            name="ck_employees_last_name_not_blank",
        ),
        sa.CheckConstraint(
            "length(trim(position)) > 0",
            name="ck_employees_position_not_blank",
        ),
        sa.CheckConstraint(
            "weekly_capacity > 0",
            name="ck_employees_weekly_capacity_positive",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_employees_user_id"),
        "employees",
        ["user_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_employees_user_id"), table_name="employees")
    op.drop_table("employees")
    employee_seniority.drop(op.get_bind(), checkfirst=True)
