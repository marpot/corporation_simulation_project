from datetime import date
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

PositiveId = Annotated[int, Field(gt=0)]
AllocationPercent = Annotated[int, Field(ge=1, le=100)]
DATE_RANGE_ERROR = "end_date must be greater than or equal to start_date"


def validate_assignment_date_range(start_date: date, end_date: date | None) -> None:
    if end_date is not None and end_date < start_date:
        raise ValueError(DATE_RANGE_ERROR)


class AssignmentCreate(BaseModel):
    employee_id: PositiveId
    project_id: PositiveId
    allocation_percent: AllocationPercent
    start_date: date
    end_date: date | None = None

    @model_validator(mode="after")
    def dates_are_consistent(self) -> "AssignmentCreate":
        validate_assignment_date_range(self.start_date, self.end_date)
        return self


class AssignmentUpdate(BaseModel):
    employee_id: PositiveId | None = None
    project_id: PositiveId | None = None
    allocation_percent: AllocationPercent | None = None
    start_date: date | None = None
    end_date: date | None = None

    @field_validator(
        "employee_id",
        "project_id",
        "allocation_percent",
        "start_date",
        mode="before",
    )
    @classmethod
    def required_values_cannot_be_null(cls, value: Any) -> Any:
        if value is None:
            raise ValueError("Field cannot be null")
        return value

    @model_validator(mode="after")
    def submitted_dates_are_consistent(self) -> "AssignmentUpdate":
        if "start_date" in self.model_fields_set and "end_date" in self.model_fields_set:
            assert self.start_date is not None
            validate_assignment_date_range(self.start_date, self.end_date)
        return self


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    project_id: int
    allocation_percent: int
    start_date: date
    end_date: date | None
