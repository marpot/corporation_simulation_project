from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.capacity import EmployeeCapacityRead
from app.services.capacity import get_employee_capacity, list_employee_capacity

router = APIRouter(prefix="/capacity", tags=["capacity"])
TargetDate = Annotated[date | None, Query(alias="date")]


def resolve_target_date(target_date: date | None) -> date:
    return target_date if target_date is not None else date.today() # noqa: DTZ011


@router.get("/employees", response_model=list[EmployeeCapacityRead])
def list_employees_capacity(
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
    target_date: TargetDate = None,
) -> list[EmployeeCapacityRead]:
    return list_employee_capacity(db, resolve_target_date(target_date))


@router.get("/employees/{employee_id}", response_model=EmployeeCapacityRead)
def read_employee_capacity(
    employee_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
    target_date: TargetDate = None,
) -> EmployeeCapacityRead:
    employee_capacity = get_employee_capacity(
        db,
        employee_id,
        resolve_target_date(target_date),
    )
    if employee_capacity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    return employee_capacity
