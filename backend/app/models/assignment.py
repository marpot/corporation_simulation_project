from sqlalchemy import CheckConstraint, Column, Date, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.db.base import Base


class Assignment(Base):
    __tablename__ = "assignments"
    __table_args__ = (
        CheckConstraint(
            "allocation_percent >= 1 AND allocation_percent <= 100",
            name="ck_assignments_allocation_percent_range",
        ),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_assignments_date_range",
        ),
    )

    id = Column(Integer, primary_key=True)
    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    allocation_percent = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    employee = relationship("Employee", back_populates="assignments")
    project = relationship("Project", back_populates="assignments")
