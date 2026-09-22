"""Create users table.

Revision ID: c3f4a1b2d5e6
Revises:
Create Date: 2026-09-22

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "c3f4a1b2d5e6"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


user_role = sa.Enum("ADMIN", "MANAGER", "EMPLOYEE", name="user_role")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column(
            "role",
            user_role,
            server_default=sa.text("'EMPLOYEE'"),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    user_role.drop(op.get_bind(), checkfirst=True)
