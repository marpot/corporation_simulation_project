from sqlalchemy import Column, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.models.skill import SkillLevel


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="CASCADE"),
        primary_key=True,
    )
    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    level = Column(Enum(SkillLevel, name="skill_level"), nullable=False)

    employee = relationship("Employee", back_populates="employee_skills")
    skill = relationship("Skill", back_populates="employee_skills")

    @property
    def skill_name(self) -> str:
        return self.skill.name
