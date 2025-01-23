# Project Documentation

## Introduction

This project is a **FastAPI** application that manages a corporation.  
The application allows for:
- adding,
- listing,
- retrieving data about employees, CEOs, departments, and managers.

---

## Project Structure

The project consists of the following folders and files:

- **`alembic.ini`**: configuration file for Alembic, a tool for managing database migrations.
- **`app/`**: folder containing the FastAPI application.
  - **`main.py`**: the main file of the FastAPI application.
  - **`database.py`**: configuration file for the database.
  - **`base.py`**: file containing the base class for database models.
  - **`controllers/`**: folder containing the application controllers.
    - **`employee_controller.py`**: controller file for employees.
  - **`models/`**: folder containing the database models.
    - **`employee.py`**: employee model file.
    - **`ceo.py`**: CEO model file.
    - **`department.py`**: department model file.
    - **`manager.py`**: manager model file.
    - **`__init__.py`**: initialization file for the models folder.
  - **`schemas/`**: folder containing data schemas.
    - **`__init__.py`**: initialization file for the schemas folder.
    - **`ceo.py`**: schema file for CEOs.
    - **`department.py`**: schema file for departments.
    - **`employee.py`**: schema file for employees.
    - **`manager.py`**: schema file for managers.
  - **`services/`**: folder containing application services.
    - **`employee_service.py`**: service file for employees.

---

## Database Models

The application uses the following database models:

- **Employee**: employee model.
- **CEO**: CEO model.
- **Department**: department model.
- **Manager**: manager model.

---

## Data Schemas

The application uses the following data schemas:

### CEO:
- **`CEOBasic`**: basic schema for a CEO.
- **`CEOCreate`**: schema for creating a CEO.
- **`CEOOut`**: output schema for a CEO.

### Department:
- **`DepartmentBase`**: basic schema for a department.
- **`DepartmentCreate`**: schema for creating a department.
- **`Department`**: output schema for a department.

### Employee:
- **`EmployeeBase`**: basic schema for an employee.
- **`EmployeeCreate`**: schema for creating an employee.
- **`EmployeeOut`**: output schema for an employee.

### Manager:
- **`ManagerBase`**: basic schema for a manager.
- **`ManagerCreate`**: schema for creating a manager.
- **`ManagerOut`**: output schema for a manager.

---

## Services

The application uses the following services:

- **`EmployeeService`**: service for employees.

---

## Controllers

The application uses the following controllers:

- **`EmployeeController`**: controller for employees.

---

## API

The application provides the following API endpoints:

### Employees:
- **POST** `/employees`: adds a new employee.
- **GET** `/employees`: returns a list of all employees.
- **GET** `/employees/{id}`: returns details of the employee with the given ID.

### CEOs:
- **POST** `/ceos`: adds a new CEO.
- **GET** `/ceos`: returns a list of all CEOs.
- **GET** `/ceos/{id}`: returns details of the CEO with the given ID.

### Departments:
- **POST** `/departments`: adds a new department.
- **GET** `/departments`: returns a list of all departments.
- **GET** `/departments/{id}`: returns details of the department with the given ID.

### Managers:
- **POST** `/managers`: adds a new manager.
- **GET** `/managers`: returns a list of all managers.
- **GET** `/managers/{id}`: returns details of the manager with the given ID.

---