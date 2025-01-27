# Project Documentation

## Introduction

This project is a **FastAPI** application designed for managing a corporation.  
The application supports:
- Adding,  
- Listing,  
- Retrieving data about employees, CEOs, departments, and managers.

It is built using Docker, PostgreSQL, and FastAPI for scalability and ease of deployment.

---

## Project Structure

The project is organized into the following key files and directories:

- **`alembic.ini`**: Configuration for Alembic, a tool for managing database migrations.
- **`app/`**: Contains the core application code:
  - **`main.py`**: The main entry point of the FastAPI application.
  - **`database.py`**: Configuration for the PostgreSQL database connection.
  - **`base.py`**: Defines the base class for database models.
  - **`controllers/`**: Application controllers.
    - **`employee_controller.py`**: Controller for managing employee endpoints.
  - **`models/`**: Database models.
    - **`employee.py`**: Employee model.
    - **`ceo.py`**: CEO model.
    - **`department.py`**: Department model.
    - **`manager.py`**: Manager model.
  - **`schemas/`**: Pydantic schemas for request and response validation.
    - **`ceo.py`**, **`department.py`**, **`employee.py`**, **`manager.py`**: Schemas for corresponding models.
  - **`services/`**: Business logic layer.
    - **`employee_service.py`**: Logic for employee-related operations.

---

## API Endpoints

The application provides a RESTful API with the following endpoints:

### Employees:
- **POST** `/employees`: Add a new employee.  
- **GET** `/employees`: Retrieve all employees.  
- **GET** `/employees/{id}`: Retrieve details of a specific employee.

### CEOs:
- **POST** `/ceos`: Add a new CEO.  
- **GET** `/ceos`: Retrieve all CEOs.  
- **GET** `/ceos/{id}`: Retrieve details of a specific CEO.

### Departments:
- **POST** `/departments`: Add a new department.  
- **GET** `/departments`: Retrieve all departments.  
- **GET** `/departments/{id}`: Retrieve details of a specific department.

### Managers:
- **POST** `/managers`: Add a new manager.  
- **GET** `/managers`: Retrieve all managers.  
- **GET** `/managers/{id}`: Retrieve details of a specific manager.

---

## Deployment Instructions

This project uses Docker and Docker Compose for containerized deployment.

### Prerequisites
1. **Docker**: Install from [Docker's official site](https://docs.docker.com/get-docker/).
2. **Docker Compose**: Install from [Docker Compose documentation](https://docs.docker.com/compose/install/).

---

### Running the Project with Docker

1. **Clone the repository**:
   ```bash
   git clone (https://github.com/marpot/corporation_simulation_project.git)
   cd <project_directory>
   ```

2. **Create a `requirements.txt` file** (if not already present):  
   Include all necessary Python dependencies:
   ```text
   fastapi
   uvicorn[standard]
   psycopg2
   ```

3. **Build and start the containers**:
   ```bash
   docker-compose up --build -d
   ```
   - `--build`: Ensures images are rebuilt with any recent changes.
   - `-d`: Runs containers in detached mode (in the background).

4. **Access the application**:
   - **FastAPI**: [http://localhost:8000](http://localhost:8000)  
   - **PostgreSQL**: `localhost:5432`  
     Use the following credentials to connect:
     - **Username**: `corporation_user`  
     - **Password**: `321meme321`  
     - **Database**: `corporation_db`

---

### Dockerfile Overview

This project uses a multi-stage `Dockerfile` for efficiency:

#### Stage 1: Builder
- Installs system dependencies and Python packages in a temporary location.  
- Uses `requirements.txt` to install dependencies with `pip`.

#### Stage 2: Runtime
- Copies installed dependencies from the builder stage.
- Includes `dockerize` to wait for the database before starting the FastAPI server.
- Uses `uvicorn` to run the application.

**Command to start the application**:
```bash
CMD ["dockerize", "-wait", "tcp://db:5432", "-timeout", "30s", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### Docker Compose Details

The project includes a `docker-compose.yml` file to define services:

#### Services:
1. **db**:
   - PostgreSQL database.
   - Uses a named volume `postgres_data` to persist data.
   - Exposes port `5432`.

2. **web**:
   - FastAPI application.
   - Depends on the `db` service.
   - Exposes port `8000`.
   - Environment variable `DATABASE_URL` is set to connect to the database.

---

### Common Commands

#### Managing Containers:
- **Check running containers**:
  ```bash
  docker ps
  ```
- **Stop containers**:
  ```bash
  docker-compose down
  ```
- **Rebuild and restart containers**:
  ```bash
  docker-compose up --build
  ```
- **Remove all containers and volumes**:
  ```bash
  docker-compose down --volumes
  ```

#### Debugging:
- **Check logs for the application**:
  ```bash
  docker logs fastapi_app
  ```
- **Check logs for the database**:
  ```bash
  docker logs postgres_db
  ```

---

## Technologies Used

- **FastAPI**: For building the RESTful API.
- **PostgreSQL**: Database for storing application data.
- **Docker & Docker Compose**: For containerized deployment.
- **Alembic**: For managing database migrations.
