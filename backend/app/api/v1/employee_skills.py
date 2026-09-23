from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.employee import Employee
from app.models.employee_skill import EmployeeSkill
from app.models.skill import Skill
from app.models.user import User, UserRole
from app.schemas.skill import EmployeeSkillCreate, EmployeeSkillRead, EmployeeSkillUpdate


router = APIRouter(prefix="/employees/{employee_id}/skills", tags=["employee-skills"])
skill_manager = require_roles(UserRole.ADMIN, UserRole.MANAGER)


def validate_employee(db: Session, employee_id: int) -> None:
    if db.get(Employee, employee_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")


def validate_skill(db: Session, skill_id: int) -> Skill:
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return skill


def get_employee_skill_or_404(db: Session, employee_id: int, skill_id: int) -> EmployeeSkill:
    employee_skill = db.get(EmployeeSkill, (employee_id, skill_id))
    if employee_skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee skill not found",
        )
    return employee_skill


def commit_employee_skill(db: Session, employee_skill: EmployeeSkill) -> EmployeeSkill:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee already has this skill",
        ) from None
    db.refresh(employee_skill)
    return employee_skill


@router.get("", response_model=list[EmployeeSkillRead])
def list_employee_skills(
    employee_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> list[EmployeeSkill]:
    validate_employee(db, employee_id)
    return (
        db.query(EmployeeSkill)
        .options(joinedload(EmployeeSkill.skill))
        .filter(EmployeeSkill.employee_id == employee_id)
        .order_by(EmployeeSkill.skill_id)
        .all()
    )


@router.post("", response_model=EmployeeSkillRead, status_code=status.HTTP_201_CREATED)
def create_employee_skill(
    employee_id: int,
    employee_skill_data: EmployeeSkillCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(skill_manager)],
) -> EmployeeSkill:
    validate_employee(db, employee_id)
    skill = validate_skill(db, employee_skill_data.skill_id)
    employee_skill = EmployeeSkill(employee_id=employee_id, **employee_skill_data.model_dump())
    employee_skill.skill = skill
    db.add(employee_skill)
    return commit_employee_skill(db, employee_skill)


@router.patch("/{skill_id}", response_model=EmployeeSkillRead)
def update_employee_skill(
    employee_id: int,
    skill_id: int,
    employee_skill_data: EmployeeSkillUpdate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(skill_manager)],
) -> EmployeeSkill:
    validate_employee(db, employee_id)
    employee_skill = get_employee_skill_or_404(db, employee_id, skill_id)
    employee_skill.level = employee_skill_data.level
    return commit_employee_skill(db, employee_skill)


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee_skill(
    employee_id: int,
    skill_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(skill_manager)],
) -> Response:
    validate_employee(db, employee_id)
    employee_skill = get_employee_skill_or_404(db, employee_id, skill_id)
    db.delete(employee_skill)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
