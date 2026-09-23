from enum import Enum as PythonEnum

from sqlalchemy import CheckConstraint, Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class SkillLevel(str, PythonEnum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class Skill(Base):
    __tablename__ = "skills"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_skills_name_not_blank"),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True, nullable=False)

    employee_skills = relationship(
        "EmployeeSkill",
        back_populates="skill",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    project_skills = relationship(
        "ProjectSkill",
        back_populates="skill",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
