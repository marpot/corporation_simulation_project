from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from app.database import Base

class Department(Base):
	__tablename__ = "departments"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String, unique=True, index=True, nullable=False)

	employees = relationship("Employee", back_populates="department")

	#TODO:
	def add_employee():
		pass
	
	#TODO:
	def remove_employee():
		pass
