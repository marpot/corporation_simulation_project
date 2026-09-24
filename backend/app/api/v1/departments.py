from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate

router = APIRouter(prefix="/departments", tags=["departments"])
department_manager = require_roles(UserRole.ADMIN, UserRole.MANAGER)


def get_department_or_404(db: Session, department_id: int) -> Department:
    department = db.get(Department, department_id)
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )
    return department


def commit_department(db: Session, department: Department) -> Department:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department could not be saved",
        ) from None
    db.refresh(department)
    return department


@router.get("", response_model=list[DepartmentRead])
def list_departments(
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> list[Department]:
    return db.query(Department).order_by(Department.id).all()


@router.get("/{department_id}", response_model=DepartmentRead)
def read_department(
    department_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> Department:
    return get_department_or_404(db, department_id)


@router.post("", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(
    department_data: DepartmentCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(department_manager)],
) -> Department:
    department = Department(**department_data.model_dump())
    db.add(department)
    return commit_department(db, department)


@router.patch("/{department_id}", response_model=DepartmentRead)
def update_department(
    department_id: int,
    department_data: DepartmentUpdate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(department_manager)],
) -> Department:
    department = get_department_or_404(db, department_id)
    for field, value in department_data.model_dump(exclude_unset=True).items():
        setattr(department, field, value)
    return commit_department(db, department)


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(department_manager)],
) -> Response:
    department = get_department_or_404(db, department_id)
    db.delete(department)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
