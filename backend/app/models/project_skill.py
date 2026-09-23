from sqlalchemy import Column, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.models.skill import SkillLevel


class ProjectSkill(Base):
    __tablename__ = "project_skills"

    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    )
    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    required_level = Column(Enum(SkillLevel, name="skill_level"), nullable=False)

    project = relationship("Project", back_populates="project_skills")
    skill = relationship("Skill", back_populates="project_skills")

    @property
    def skill_name(self) -> str:
        return self.skill.name
