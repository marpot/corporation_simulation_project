from enum import Enum as PythonEnum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    Enum,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class ProjectStatus(str, PythonEnum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_projects_name_not_blank"),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_projects_date_range",
        ),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus, name="project_status"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    active = Column(Boolean, default=True, server_default="true", nullable=False)

    assignments = relationship(
        "Assignment",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    project_skills = relationship(
        "ProjectSkill",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
