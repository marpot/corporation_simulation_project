from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Manager(Base):
    __tablename__ = "managers"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    salary = Column(Integer, nullable=False)
    
    employees = relationship("Employee", back_populates="managers")
