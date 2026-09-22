from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.models.employee import Seniority


NonEmptyText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
PositiveId = Annotated[int, Field(gt=0)]
PositiveCapacity = Annotated[int, Field(gt=0)]


class EmployeeCreate(BaseModel):
    first_name: NonEmptyText
    last_name: NonEmptyText
    position: NonEmptyText
    seniority: Seniority
    weekly_capacity: PositiveCapacity
    active: bool = True
    user_id: PositiveId | None = None


class EmployeeUpdate(BaseModel):
    first_name: NonEmptyText | None = None
    last_name: NonEmptyText | None = None
    position: NonEmptyText | None = None
    seniority: Seniority | None = None
    weekly_capacity: PositiveCapacity | None = None
    active: bool | None = None
    user_id: PositiveId | None = None

    @field_validator(
        "first_name",
        "last_name",
        "position",
        "seniority",
        "weekly_capacity",
        "active",
        mode="before",
    )
    @classmethod
    def required_values_cannot_be_null(cls, value: Any) -> Any:
        if value is None:
            raise ValueError("Field cannot be null")
        return value


class EmployeeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    position: str
    seniority: Seniority
    weekly_capacity: int
    active: bool
    user_id: int | None
