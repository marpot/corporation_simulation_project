from pydantic import BaseModel
from typing import Optional

class EmployeeBase(BaseModel):
    name: str
    age: int
    salary: int
    ceo_id: Optional[int] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeOut(EmployeeBase):
    id: int
    
    class Config:
        orm_mode = True  # Dzięki temu Pydantic wie, jak przekształcić SQLAlchemy obiekt do JSON
