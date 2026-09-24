from datetime import date
from typing import Annotated, Any

from pydantic import (
    BaseModel,
    ConfigDict,
    StringConstraints,
    field_validator,
    model_validator,
)

from app.models.project import ProjectStatus

ProjectName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
DATE_RANGE_ERROR = "end_date must be greater than or equal to start_date"


def validate_project_date_range(start_date: date, end_date: date | None) -> None:
    if end_date is not None and end_date < start_date:
        raise ValueError(DATE_RANGE_ERROR)


class ProjectCreate(BaseModel):
    name: ProjectName
    description: str | None = None
    status: ProjectStatus
    start_date: date
    end_date: date | None = None
    active: bool = True

    @model_validator(mode="after")
    def dates_are_consistent(self) -> "ProjectCreate":
        validate_project_date_range(self.start_date, self.end_date)
        return self


class ProjectUpdate(BaseModel):
    name: ProjectName | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    start_date: date | None = None
    end_date: date | None = None
    active: bool | None = None

    @field_validator("name", "status", "start_date", "active", mode="before")
    @classmethod
    def required_values_cannot_be_null(cls, value: Any) -> Any:
        if value is None:
            raise ValueError("Field cannot be null")
        return value

    @model_validator(mode="after")
    def submitted_dates_are_consistent(self) -> "ProjectUpdate":
        if "start_date" in self.model_fields_set and "end_date" in self.model_fields_set:
            assert self.start_date is not None
            validate_project_date_range(self.start_date, self.end_date)
        return self


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    status: ProjectStatus
    start_date: date
    end_date: date | None
    active: bool
