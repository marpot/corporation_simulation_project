from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.department import Department

def add_employee_to_department(session: Session, department: department, employee: Employee):
	employee.department_id = department.id
	session.add(employee)
	session.commit()

def remove_employee_from_department(session: Session, department: Department, employee: Employee):
	if employee.department_id != department_id:
		raise ValueError("Pracownik nie należy do tego działu.")
	employee.department_id = None
	session.add(employee)
	session.commit()