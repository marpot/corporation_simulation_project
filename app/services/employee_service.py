from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeOut
from fastapi import HTTPException
from typing import List
from app.models.ceo import Ceo

class EmployeeService:
    def __init__(self, db: Session):
        self.db = db

    def add_employee(self, employee_create: EmployeeCreate) -> EmployeeOut:

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

        return EmployeeOut.from_orm(new_employee)

    def list_employees(self) -> List[EmployeeOut]:
        """
        Zwraca listę wszystkich pracowników z bazy danych.
        """
        employees = self.db.query(Employee).all()
        return [EmployeeOut.from_orm(emp) for emp in employees]

    def get_employee(self, name: str) -> EmployeeOut:
        """
        Zwraca szczegóły pracownika na podstawie jego nazwy, jeśli istnieje.
        """
        employee = self.db.query(Employee).filter(Employee.name == name).first()
        if employee:
            return EmployeeOut.from_orm(employee)
        raise HTTPException(status_code=404, detail="Employee not found")
