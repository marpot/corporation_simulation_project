from pydantic import BaseModel
from typing import Optional

class ManagerBase(BaseModel):
    name: str
    age: int
    salary: int
    employee_id: Optional[int] = None  # Opcjonalne pole, jeśli manager nie ma przypisanego pracownika

class ManagerCreate(ManagerBase):
    pass

class ManagerOut(ManagerBase):
    id: int
    
    class Config:
        orm_mode = True
