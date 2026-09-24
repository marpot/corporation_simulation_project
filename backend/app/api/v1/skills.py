from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.skill import Skill
from app.models.user import User, UserRole
from app.schemas.skill import SkillCreate, SkillRead, SkillUpdate

router = APIRouter(prefix="/skills", tags=["skills"])
skill_manager = require_roles(UserRole.ADMIN, UserRole.MANAGER)


def get_skill_or_404(db: Session, skill_id: int) -> Skill:
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )
    return skill


def commit_skill(db: Session, skill: Skill) -> Skill:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Skill name already exists",
        ) from None
    db.refresh(skill)
    return skill


@router.get("", response_model=list[SkillRead])
def list_skills(
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> list[Skill]:
    return db.query(Skill).order_by(Skill.id).all()


@router.get("/{skill_id}", response_model=SkillRead)
def read_skill(
    skill_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> Skill:
    return get_skill_or_404(db, skill_id)


@router.post("", response_model=SkillRead, status_code=status.HTTP_201_CREATED)
def create_skill(
    skill_data: SkillCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(skill_manager)],
) -> Skill:
    skill = Skill(**skill_data.model_dump())
    db.add(skill)
    return commit_skill(db, skill)


@router.patch("/{skill_id}", response_model=SkillRead)
def update_skill(
    skill_id: int,
    skill_data: SkillUpdate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(skill_manager)],
) -> Skill:
    skill = get_skill_or_404(db, skill_id)
    for field, value in skill_data.model_dump(exclude_unset=True).items():
        setattr(skill, field, value)
    return commit_skill(db, skill)


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(skill_manager)],
) -> Response:
    skill = get_skill_or_404(db, skill_id)
    db.delete(skill)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
