from pydantic import BaseModel
from typing import Optional
from typing import List
from app.schemas.employee import EmployeeOut


class ManagerBase(BaseModel):
    name: str
    age: int
    salary: int
    employee_id: Optional[int] = None  # Opcjonalne pole, jeśli manager nie ma przypisanego pracownika

class ManagerCreate(ManagerBase):
    pass

class ManagerOut(ManagerBase):
    id: int
    employees: List[EmployeeOut] = []
    
    class Config:
        orm_mode = True
