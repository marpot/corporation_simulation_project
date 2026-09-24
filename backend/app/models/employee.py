from enum import Enum as PythonEnum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class Seniority(str, PythonEnum):
    JUNIOR = "JUNIOR"
    MID = "MID"
    SENIOR = "SENIOR"
    LEAD = "LEAD"


class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = (
        CheckConstraint("length(trim(first_name)) > 0", name="ck_employees_first_name_not_blank"),
        CheckConstraint("length(trim(last_name)) > 0", name="ck_employees_last_name_not_blank"),
        CheckConstraint("length(trim(position)) > 0", name="ck_employees_position_not_blank"),
        CheckConstraint("weekly_capacity > 0", name="ck_employees_weekly_capacity_positive"),
    )

    id = Column(Integer, primary_key=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    seniority = Column(Enum(Seniority, name="employee_seniority"), nullable=False)
    weekly_capacity = Column(Integer, nullable=False)
    active = Column(Boolean, default=True, server_default="true", nullable=False)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        unique=True,
        index=True,
        nullable=True,
    )
    department_id = Column(
        Integer,
        ForeignKey("departments.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    department = relationship("Department", back_populates="employees")
    assignments = relationship(
        "Assignment",
        back_populates="employee",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    employee_skills = relationship(
        "EmployeeSkill",
        back_populates="employee",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
