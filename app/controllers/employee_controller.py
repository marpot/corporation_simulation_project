from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.ext.declarative import declarative_base
from app.services.employee_service import EmployeeService
from app.schemas.employee import EmployeeCreate, EmployeeOut, PolymorphicEmployeeOut
from app.database import SessionLocal


router = APIRouter()

Base = declarative_base()

# Funkcja do uzyskania sesji bazy danych
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utwórz instancję usługi, przekazując sesję bazy danych
@router.post("/employees/add", response_model=EmployeeOut)
def add_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    employee_service = EmployeeService(db)
    return employee_service.add_employee(employee)

@router.get("/employees/", response_model=list[EmployeeOut])
def list_employees(db: Session = Depends(get_db)):
    employee_service = EmployeeService(db)
    return employee_service.list_employees()
    return [
        PolymorphicEmployeeOut(
            id=employee.id,
            name=employee.name,
            age=employee.age,
            salary=employee.salary,
            ceo_id=employee.ceo_id,
            manager_id=employee.manager_id,
            department_id=employee.department_id,
            type=employee.type
            )
            for employee in employees
    ]

@router.get("/employees/{name}")
def get_employee(name: str, db: Session = Depends(get_db)):
    employee_service = EmployeeService(db)
    return employee_service.get_employee(name)
