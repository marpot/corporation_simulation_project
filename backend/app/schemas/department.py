from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator


DepartmentName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class DepartmentCreate(BaseModel):
    name: DepartmentName
    description: str | None = None
    active: bool = True


class DepartmentUpdate(BaseModel):
    name: DepartmentName | None = None
    description: str | None = None
    active: bool | None = None

    @field_validator("name", "active", mode="before")
    @classmethod
    def required_values_cannot_be_null(cls, value: Any) -> Any:
        if value is None:
            raise ValueError("Field cannot be null")
        return value


class DepartmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    active: bool
