from typing import List, Optional
from pydantic import BaseModel
from .employee import EmployeeOut

class DepartmentBase(BaseModel):
	name: str

class DepartmentCreate(DepartmentBase):
	pass

class Department(DepartmentBase):
	id: int
	employees: List[EmployeeOut] = []

	class Config:
		orm_mode = True