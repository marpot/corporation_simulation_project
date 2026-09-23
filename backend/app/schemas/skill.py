from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.models.skill import SkillLevel


SkillName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
PositiveId = Annotated[int, Field(gt=0)]


class SkillCreate(BaseModel):
    name: SkillName


class SkillUpdate(BaseModel):
    name: SkillName | None = None

    @field_validator("name", mode="before")
    @classmethod
    def name_cannot_be_null(cls, value: Any) -> Any:
        if value is None:
            raise ValueError("Field cannot be null")
        return value


class SkillRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class EmployeeSkillCreate(BaseModel):
    skill_id: PositiveId
    level: SkillLevel


class EmployeeSkillUpdate(BaseModel):
    level: SkillLevel


class EmployeeSkillRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    skill_id: int
    skill_name: str
    level: SkillLevel


class ProjectSkillCreate(BaseModel):
    skill_id: PositiveId
    required_level: SkillLevel


class ProjectSkillUpdate(BaseModel):
    required_level: SkillLevel


class ProjectSkillRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    skill_id: int
    skill_name: str
    required_level: SkillLevel
