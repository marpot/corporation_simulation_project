from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.project import Project
from app.models.project_skill import ProjectSkill
from app.models.skill import Skill
from app.models.user import User, UserRole
from app.schemas.skill import ProjectSkillCreate, ProjectSkillRead, ProjectSkillUpdate


router = APIRouter(prefix="/projects/{project_id}/skills", tags=["project-skills"])
skill_manager = require_roles(UserRole.ADMIN, UserRole.MANAGER)


def validate_project(db: Session, project_id: int) -> None:
    if db.get(Project, project_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


def validate_skill(db: Session, skill_id: int) -> Skill:
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return skill


def get_project_skill_or_404(db: Session, project_id: int, skill_id: int) -> ProjectSkill:
    project_skill = db.get(ProjectSkill, (project_id, skill_id))
    if project_skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project skill not found",
        )
    return project_skill


def commit_project_skill(db: Session, project_skill: ProjectSkill) -> ProjectSkill:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project already requires this skill",
        ) from None
    db.refresh(project_skill)
    return project_skill


@router.get("", response_model=list[ProjectSkillRead])
def list_project_skills(
    project_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> list[ProjectSkill]:
    validate_project(db, project_id)
    return (
        db.query(ProjectSkill)
        .options(joinedload(ProjectSkill.skill))
        .filter(ProjectSkill.project_id == project_id)
        .order_by(ProjectSkill.skill_id)
        .all()
    )


@router.post("", response_model=ProjectSkillRead, status_code=status.HTTP_201_CREATED)
def create_project_skill(
    project_id: int,
    project_skill_data: ProjectSkillCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(skill_manager)],
) -> ProjectSkill:
    validate_project(db, project_id)
    skill = validate_skill(db, project_skill_data.skill_id)
    project_skill = ProjectSkill(project_id=project_id, **project_skill_data.model_dump())
    project_skill.skill = skill
    db.add(project_skill)
    return commit_project_skill(db, project_skill)


@router.patch("/{skill_id}", response_model=ProjectSkillRead)
def update_project_skill(
    project_id: int,
    skill_id: int,
    project_skill_data: ProjectSkillUpdate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(skill_manager)],
) -> ProjectSkill:
    validate_project(db, project_id)
    project_skill = get_project_skill_or_404(db, project_id, skill_id)
    project_skill.required_level = project_skill_data.required_level
    return commit_project_skill(db, project_skill)


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_skill(
    project_id: int,
    skill_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(skill_manager)],
) -> Response:
    validate_project(db, project_id)
    project_skill = get_project_skill_or_404(db, project_id, skill_id)
    db.delete(project_skill)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
