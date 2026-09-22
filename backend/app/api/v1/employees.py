from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.employee import Employee
from app.models.user import User, UserRole
from app.schemas.employee import EmployeeCreate, EmployeeRead, EmployeeUpdate


router = APIRouter(prefix="/employees", tags=["employees"])
employee_manager = require_roles(UserRole.ADMIN, UserRole.MANAGER)


def get_employee_or_404(db: Session, employee_id: int) -> Employee:
    employee = db.get(Employee, employee_id)
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    return employee


def commit_employee(db: Session, employee: Employee) -> Employee:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee could not be saved",
        ) from None
    db.refresh(employee)
    return employee


@router.get("", response_model=list[EmployeeRead])
def list_employees(
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> list[Employee]:
    return db.query(Employee).order_by(Employee.id).all()


@router.get("/{employee_id}", response_model=EmployeeRead)
def read_employee(
    employee_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> Employee:
    return get_employee_or_404(db, employee_id)


@router.post("", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_data: EmployeeCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(employee_manager)],
) -> Employee:
    employee = Employee(**employee_data.model_dump())
    db.add(employee)
    return commit_employee(db, employee)


@router.patch("/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(employee_manager)],
) -> Employee:
    employee = get_employee_or_404(db, employee_id)
    for field, value in employee_data.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    return commit_employee(db, employee)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(employee_manager)],
) -> Response:
    employee = get_employee_or_404(db, employee_id)
    db.delete(employee)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
