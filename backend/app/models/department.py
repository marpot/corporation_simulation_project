from sqlalchemy import Boolean, CheckConstraint, Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Department(Base):
    __tablename__ = "departments"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_departments_name_not_blank"),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, server_default="true", nullable=False)

    employees = relationship("Employee", back_populates="department")
