from pydantic import BaseModel, validator
from typing import Optional
from .ceo import CEOOut

class EmployeeBase(BaseModel):
    name: str
    age: int
    salary: int
    ceo_id: Optional[int] = None
    manager_id: Optional[int] = None
    department_id: Optional[int] = None

    class Config:
        from_attributes = True

    @validator("ceo_id")
    def validate_ceo_id(cls, value):
        if value is not None and value <= 0:
            raise ValueError("CEO ID must be greater than 0.")
        return value

    @validator("age")
    def validate_age(cls, value):
        if value <= 0:
            raise ValueError("Age must be greater than 0.")
        return value

    @validator("salary")
    def validate_salary(cls, value):
        if value < 0:
            raise ValueError("Salary cannot be negative.")
        return value

    @validator("name")
    def validate_name(cls, value):
        if not value.strip():
            raise ValueError("Name cannot be empty.")
        return value

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeOut(EmployeeBase):
    id: int
    type: str
    department_name: Optional[str] = None
    ceo: Optional[CEOOut] = None
    
    class Config:
        from_attributes = True

    def get_department_name(self, department_mapping):
        if self.department_id is not None:
            return department_mapping.get(self.department_id, "Unkown")
        return "No Department"
        
class PolymorphicEmployeeOut(EmployeeOut):
    type: str

