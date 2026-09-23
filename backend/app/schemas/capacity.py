from enum import Enum

from pydantic import BaseModel


class CapacityStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    FULLY_ALLOCATED = "FULLY_ALLOCATED"
    OVERALLOCATED = "OVERALLOCATED"


class EmployeeCapacityRead(BaseModel):
    employee_id: int
    employee_name: str
    allocated_percent: int
    available_percent: int
    status: CapacityStatus
