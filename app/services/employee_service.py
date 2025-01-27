from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeOut, PolymorphicEmployeeOut
from fastapi import HTTPException
from typing import List
from app.models.ceo import Ceo

class EmployeeService:
    def __init__(self, db: Session):
        self.db = db

    def add_employee(self, employee_create: EmployeeCreate) -> PolymorphicEmployeeOut:

        ceo = self.db.query(Ceo).filter(Ceo.id == employee_create.ceo_id).first()
        if not ceo:
            raise HTTPException(status_code=400, detail=f"CEO with ID {employee_create.ceo_id} does not exist")

        existing_employee = self.db.query(Employee).filter(Employee.name == employee_create.name).first()
        if existing_employee:
            raise HTTPException(status_code=400, detail=f"Employee {employee_create.name} already exist")

        # Utwórz nowego pracownika
        new_employee = Employee(**employee_create.dict())
        self.db.add(new_employee)
        self.db.commit()
        self.db.refresh(new_employee)

        return PolymorphicEmployeeOut(
            id=new_employee.id,
            name=new_employee.name,
            age=new_employee.age,
            salary=new_employee.salary,
            ceo_id=new_employee.ceo_id,
            manager_id=new_employee.manager_id,
            department_id=new_employee.department_id,
            type=new_employee.type  # Pobierz typ pracownika
        )

    def list_employees(self) -> List[PolymorphicEmployeeOut]:
        """
        Zwraca listę wszystkich pracowników z bazy danych.
        """
        employees = self.db.query(Employee).all()
        return [
        PolymorphicEmployeeOut(
            id=emp.id,
            name=emp.name,
            age=emp.age,
            salary=emp.salary,
            ceo_id=emp.ceo_id,
            manager_id=emp.manager_id,
            department_id=emp.department_id,
            type=emp.type  # Pole `type` z modelu Employee
        )
        for emp in employees
        ]

    def get_employee(self, name: str) -> PolymorphicEmployeeOut:
        employee = self.db.query(Employee).filter(Employee.name == name).first()
        if employee:
            return PolymorphicEmployeeOut(
                id=employee.id,
                name=employee.name,
                age=employee.age,
                salary=employee.salary,
                ceo_id=employee.ceo_id,
                manager_id=employee.manager_id,
                department_id=employee.department_id,
                type=employee.type  # Pobierz typ pracownika
            )
        raise HTTPException(status_code=404, detail="Employee not found")