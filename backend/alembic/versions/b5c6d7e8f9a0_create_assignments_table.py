"""Create assignments table.

Revision ID: b5c6d7e8f9a0
Revises: a4b5c6d7e8f9
Create Date: 2026-09-23

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "b5c6d7e8f9a0"
down_revision: str | None = "a4b5c6d7e8f9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("allocation_percent", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.CheckConstraint(
            "allocation_percent >= 1 AND allocation_percent <= 100",
            name="ck_assignments_allocation_percent_range",
        ),
        sa.CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_assignments_date_range",
        ),
        sa.ForeignKeyConstraint(
            ["employee_id"],
            ["employees.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_assignments_employee_id"),
        "assignments",
        ["employee_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_assignments_project_id"),
        "assignments",
        ["project_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_assignments_project_id"), table_name="assignments")
    op.drop_index(op.f("ix_assignments_employee_id"), table_name="assignments")
    op.drop_table("assignments")
