"""Create skills and skill association tables.

Revision ID: c6d7e8f9a0b1
Revises: b5c6d7e8f9a0
Create Date: 2026-09-23

"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy.dialects import postgresql
import sqlalchemy as sa


revision: str = "c6d7e8f9a0b1"
down_revision: str | None = "b5c6d7e8f9a0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


skill_level = postgresql.ENUM(
    "BEGINNER",
    "INTERMEDIATE",
    "ADVANCED",
    "EXPERT",
    name="skill_level",
    create_type=False,
)


def upgrade() -> None:
    skill_level.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "skills",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.CheckConstraint("length(trim(name)) > 0", name="ck_skills_name_not_blank"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_skills_name"), "skills", ["name"], unique=True)
    op.create_table(
        "employee_skills",
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("skill_id", sa.Integer(), nullable=False),
        sa.Column("level", skill_level, nullable=False),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("employee_id", "skill_id"),
    )
    op.create_index(
        op.f("ix_employee_skills_skill_id"),
        "employee_skills",
        ["skill_id"],
        unique=False,
    )
    op.create_table(
        "project_skills",
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("skill_id", sa.Integer(), nullable=False),
        sa.Column("required_level", skill_level, nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("project_id", "skill_id"),
    )
    op.create_index(
        op.f("ix_project_skills_skill_id"),
        "project_skills",
        ["skill_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_project_skills_skill_id"), table_name="project_skills")
    op.drop_table("project_skills")
    op.drop_index(op.f("ix_employee_skills_skill_id"), table_name="employee_skills")
    op.drop_table("employee_skills")
    op.drop_index(op.f("ix_skills_name"), table_name="skills")
    op.drop_table("skills")
    skill_level.drop(op.get_bind(), checkfirst=True)
