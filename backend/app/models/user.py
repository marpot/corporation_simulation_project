from enum import Enum as PythonEnum

from sqlalchemy import Boolean, Column, Enum, Integer, String

from app.db.base import Base


class UserRole(str, PythonEnum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(
        Enum(UserRole, name="user_role"),
        default=UserRole.EMPLOYEE,
        server_default=UserRole.EMPLOYEE.value,
        nullable=False,
    )
    is_active = Column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )
