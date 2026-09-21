from pydantic import BaseModel
from typing import List

class CEOBasic(BaseModel):
	name: str
	age: int
	salary: int

class CEOCreate(CEOBasic):
	pass

class CEOOut(CEOBasic):
	id: int
	departments: List['Department'] = []
	employees: List['EmployeeOut'] = []

	class Config:
		orm_mode = True