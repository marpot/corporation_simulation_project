from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.employee import Employee
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.assignment import (
    DATE_RANGE_ERROR,
    AssignmentCreate,
    AssignmentRead,
    AssignmentUpdate,
    validate_assignment_date_range,
)

router = APIRouter(prefix="/assignments", tags=["assignments"])
assignment_manager = require_roles(UserRole.ADMIN, UserRole.MANAGER)


def get_assignment_or_404(db: Session, assignment_id: int) -> Assignment:
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    return assignment


def validate_employee(db: Session, employee_id: int) -> None:
    if db.get(Employee, employee_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Employee not found",
        )


def validate_project(db: Session, project_id: int) -> None:
    if db.get(Project, project_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Project not found",
        )


def commit_assignment(db: Session, assignment: Assignment) -> Assignment:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Assignment could not be saved",
        ) from None
    db.refresh(assignment)
    return assignment


@router.get("", response_model=list[AssignmentRead])
def list_assignments(
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> list[Assignment]:
    return db.query(Assignment).order_by(Assignment.id).all()


@router.get("/{assignment_id}", response_model=AssignmentRead)
def read_assignment(
    assignment_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> Assignment:
    return get_assignment_or_404(db, assignment_id)


@router.post("", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment_data: AssignmentCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(assignment_manager)],
) -> Assignment:
    validate_employee(db, assignment_data.employee_id)
    validate_project(db, assignment_data.project_id)
    assignment = Assignment(**assignment_data.model_dump())
    db.add(assignment)
    return commit_assignment(db, assignment)


@router.patch("/{assignment_id}", response_model=AssignmentRead)
def update_assignment(
    assignment_id: int,
    assignment_data: AssignmentUpdate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(assignment_manager)],
) -> Assignment:
    assignment = get_assignment_or_404(db, assignment_id)
    update_data = assignment_data.model_dump(exclude_unset=True)
    if "employee_id" in update_data:
        validate_employee(db, update_data["employee_id"])
    if "project_id" in update_data:
        validate_project(db, update_data["project_id"])

    resulting_start_date = update_data.get("start_date", assignment.start_date)
    resulting_end_date = update_data.get("end_date", assignment.end_date)
    try:
        validate_assignment_date_range(resulting_start_date, resulting_end_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=DATE_RANGE_ERROR,
        ) from None

    for field, value in update_data.items():
        setattr(assignment, field, value)
    return commit_assignment(db, assignment)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(assignment_manager)],
) -> Response:
    assignment = get_assignment_or_404(db, assignment_id)
    db.delete(assignment)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
