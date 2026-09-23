from datetime import date

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Query, Session

from app.models.assignment import Assignment
from app.models.employee import Employee
from app.schemas.capacity import CapacityStatus, EmployeeCapacityRead


def calculate_capacity(
    employee_id: int,
    employee_name: str,
    allocated_percent: int,
) -> EmployeeCapacityRead:
    if allocated_percent < 100:
        capacity_status = CapacityStatus.AVAILABLE
    elif allocated_percent == 100:
        capacity_status = CapacityStatus.FULLY_ALLOCATED
    else:
        capacity_status = CapacityStatus.OVERALLOCATED

    return EmployeeCapacityRead(
        employee_id=employee_id,
        employee_name=employee_name,
        allocated_percent=allocated_percent,
        available_percent=max(0, 100 - allocated_percent),
        status=capacity_status,
    )


def _capacity_query(db: Session, target_date: date) -> Query:
    allocated_percent = func.coalesce(func.sum(Assignment.allocation_percent), 0).label(
        "allocated_percent"
    )
    return (
        db.query(
            Employee.id,
            Employee.first_name,
            Employee.last_name,
            allocated_percent,
        )
        .outerjoin(
            Assignment,
            and_(
                Assignment.employee_id == Employee.id,
                Assignment.start_date <= target_date,
                or_(Assignment.end_date.is_(None), Assignment.end_date >= target_date),
            ),
        )
        .group_by(Employee.id, Employee.first_name, Employee.last_name)
    )


def _result_from_row(row: object) -> EmployeeCapacityRead:
    return calculate_capacity(
        employee_id=row.id,
        employee_name=f"{row.first_name} {row.last_name}",
        allocated_percent=int(row.allocated_percent),
    )


def list_employee_capacity(db: Session, target_date: date) -> list[EmployeeCapacityRead]:
    rows = (
        _capacity_query(db, target_date)
        .filter(Employee.active.is_(True))
        .order_by(Employee.id)
        .all()
    )
    return [_result_from_row(row) for row in rows]


def get_employee_capacity(
    db: Session,
    employee_id: int,
    target_date: date,
) -> EmployeeCapacityRead | None:
    row = _capacity_query(db, target_date).filter(Employee.id == employee_id).one_or_none()
    return _result_from_row(row) if row is not None else None
