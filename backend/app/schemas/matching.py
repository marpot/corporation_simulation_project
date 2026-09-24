from pydantic import BaseModel

from app.models.skill import SkillLevel
from app.schemas.capacity import CapacityStatus


class SkillRequirementMatchRead(BaseModel):
    skill_id: int
    skill_name: str
    required_level: SkillLevel
    employee_level: SkillLevel | None
    met: bool


class EmployeeProjectMatchRead(BaseModel):
    employee_id: int
    employee_name: str
    requirements_met: int
    requirements_total: int
    matched_requirements: list[SkillRequirementMatchRead]
    unmet_requirements: list[SkillRequirementMatchRead]
    allocated_percent: int
    available_percent: int
    capacity_status: CapacityStatus
