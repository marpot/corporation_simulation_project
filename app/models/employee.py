from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.ceo import Ceo
from app.models.manager import Manager


class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    salary = Column(Integer, nullable=False)

    type = Column(String, nullable=False)

    ceo_id = Column(Integer, ForeignKey('ceos.id'))
    ceo = relationship(Ceo, back_populates="employees")

    manager_id = Column(Integer, ForeignKey('managers.id'))
    manager = relationship(Manager, back_populates="employees")

    department_id = Column(Integer, ForeignKey('departments.id'))
    department = relationship("Department", back_populates="employees")

    