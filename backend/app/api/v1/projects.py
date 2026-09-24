from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.matching import EmployeeProjectMatchRead
from app.schemas.project import (
    DATE_RANGE_ERROR,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
    validate_project_date_range,
)
from app.services.matching import list_project_matches

router = APIRouter(prefix="/projects", tags=["projects"])
project_manager = require_roles(UserRole.ADMIN, UserRole.MANAGER)


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


def commit_project(db: Session, project: Project) -> Project:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project could not be saved",
        ) from None
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectRead])
def list_projects(
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> list[Project]:
    return db.query(Project).order_by(Project.id).all()


@router.get("/{project_id}", response_model=ProjectRead)
def read_project(
    project_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> Project:
    return get_project_or_404(db, project_id)


@router.get("/{project_id}/matching", response_model=list[EmployeeProjectMatchRead])
def read_project_matching(
    project_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
    target_date: Annotated[date | None, Query(alias="date")] = None,
) -> list[EmployeeProjectMatchRead]:
    matches = list_project_matches(
        db,
        project_id,
        target_date if target_date is not None else date.today(),  # noqa: DTZ011
    )
    if matches is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return matches


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(project_manager)],
) -> Project:
    project = Project(**project_data.model_dump())
    db.add(project)
    return commit_project(db, project)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(project_manager)],
) -> Project:
    project = get_project_or_404(db, project_id)
    update_data = project_data.model_dump(exclude_unset=True)
    resulting_start_date = update_data.get("start_date", project.start_date)
    resulting_end_date = update_data.get("end_date", project.end_date)

    try:
        validate_project_date_range(resulting_start_date, resulting_end_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=DATE_RANGE_ERROR,
        ) from None

    for field, value in update_data.items():
        setattr(project, field, value)
    return commit_project(db, project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(project_manager)],
) -> Response:
    project = get_project_or_404(db, project_id)
    db.delete(project)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
