from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.models.employee_skill import EmployeeSkill
from app.models.project import Project
from app.models.project_skill import ProjectSkill
from app.models.skill import SkillLevel
from app.schemas.matching import EmployeeProjectMatchRead, SkillRequirementMatchRead
from app.services.capacity import list_employee_capacity

SKILL_LEVEL_ORDER = {
    SkillLevel.BEGINNER: 1,
    SkillLevel.INTERMEDIATE: 2,
    SkillLevel.ADVANCED: 3,
    SkillLevel.EXPERT: 4,
}


def meets_requirement(
    employee_level: SkillLevel,
    required_level: SkillLevel,
) -> bool:
    return SKILL_LEVEL_ORDER[employee_level] >= SKILL_LEVEL_ORDER[required_level]


def list_project_matches(
    db: Session,
    project_id: int,
    target_date: date,
) -> list[EmployeeProjectMatchRead] | None:
    if db.get(Project, project_id) is None:
        return None

    requirements = (
        db.query(ProjectSkill)
        .options(joinedload(ProjectSkill.skill))
        .filter(ProjectSkill.project_id == project_id)
        .order_by(ProjectSkill.skill_id)
        .all()
    )
    capacities = list_employee_capacity(db, target_date)
    employee_levels: dict[tuple[int, int], SkillLevel] = {}

    if requirements and capacities:
        employee_ids = [capacity.employee_id for capacity in capacities]
        required_skill_ids = [requirement.skill_id for requirement in requirements]
        employee_skills = (
            db.query(EmployeeSkill)
            .filter(
                EmployeeSkill.employee_id.in_(employee_ids),
                EmployeeSkill.skill_id.in_(required_skill_ids),
            )
            .all()
        )
        employee_levels = {
            (employee_skill.employee_id, employee_skill.skill_id): employee_skill.level
            for employee_skill in employee_skills
        }

    matches = []
    for capacity in capacities:
        explanations = []
        for requirement in requirements:
            employee_level = employee_levels.get(
                (capacity.employee_id, requirement.skill_id)
            )
            met = employee_level is not None and meets_requirement(
                employee_level,
                requirement.required_level,
            )
            explanations.append(
                SkillRequirementMatchRead(
                    skill_id=requirement.skill_id,
                    skill_name=requirement.skill.name,
                    required_level=requirement.required_level,
                    employee_level=employee_level,
                    met=met,
                )
            )

        matched_requirements = [explanation for explanation in explanations if explanation.met]
        unmet_requirements = [explanation for explanation in explanations if not explanation.met]
        matches.append(
            EmployeeProjectMatchRead(
                employee_id=capacity.employee_id,
                employee_name=capacity.employee_name,
                requirements_met=len(matched_requirements),
                requirements_total=len(requirements),
                matched_requirements=matched_requirements,
                unmet_requirements=unmet_requirements,
                allocated_percent=capacity.allocated_percent,
                available_percent=capacity.available_percent,
                capacity_status=capacity.status,
            )
        )

    return sorted(
        matches,
        key=lambda match: (
            -match.requirements_met,
            -match.available_percent,
            match.employee_id,
        ),
    )
