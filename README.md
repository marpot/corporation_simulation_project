# Corporation Management API 🏢

**REST API for managing a corporation structure, built with FastAPI, PostgreSQL, SQLAlchemy and Alembic.**

This backend project models core organizational entities such as employees, managers, departments and CEOs. It demonstrates layered API architecture, relational persistence, request/response validation, database migrations and containerized local development.

## ✨ Features

- REST endpoints for employees, managers, departments and CEOs
- Create and retrieve organizational data
- Pydantic request/response schemas
- SQLAlchemy database models
- Service layer for business logic
- Controller/API layer separated from persistence logic
- PostgreSQL persistence
- Alembic database migrations
- Docker and Docker Compose development environment
- Multi-stage application Dockerfile

## 🧱 Architecture

```text
Client
  │
  ▼
FastAPI Controllers
  │
  ▼
Service Layer
  │
  ▼
SQLAlchemy Models
  │
  ▼
PostgreSQL
```

The project separates API endpoints, validation schemas, database models and business logic instead of placing all behavior in the FastAPI entry point.

## 🛠 Tech Stack

**Language:** Python  
**API:** FastAPI · Uvicorn  
**Database:** PostgreSQL · SQLAlchemy  
**Validation:** Pydantic  
**Migrations:** Alembic  
**Infrastructure:** Docker · Docker Compose

## 📂 Project Structure

```text
corporation_simulation_project/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── base.py
│   ├── controllers/
│   ├── models/
│   ├── schemas/
│   └── services/
├── alembic/
├── alembic.ini
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

## 📡 API Endpoints

### Employees

```text
POST /employees
GET  /employees
GET  /employees/{id}
```

### CEOs

```text
POST /ceos
GET  /ceos
GET  /ceos/{id}
```

### Departments

```text
POST /departments
GET  /departments
GET  /departments/{id}
```

### Managers

```text
POST /managers
GET  /managers
GET  /managers/{id}
```

FastAPI also provides interactive API documentation when the application is running.

## 🚀 Local Development

### Requirements

- Docker
- Docker Compose

Clone the repository:

```bash
git clone https://github.com/marpot/corporation_simulation_project.git
cd corporation_simulation_project
```

Create your local environment file from the safe example:

```bash
cp .env.example .env
```

Set your own local database password/connection values in `.env`. Do not commit the resulting file.

Build and start the services:

```bash
docker compose up --build -d
```

The FastAPI application is available locally on port `8000` and PostgreSQL on port `5432` according to the Docker Compose configuration.

Stop the environment:

```bash
docker compose down
```

## 🗄 Database Migrations

Alembic is included for managing schema changes. Migration configuration is stored in `alembic.ini` and the `alembic/` directory.

## 📌 Project Status

This is a smaller backend portfolio project focused on FastAPI, relational data modeling and Dockerized API development. Compared with the larger full-stack projects in this portfolio, its scope is intentionally limited to backend/API architecture.

A useful next improvement would be adding a comprehensive automated test suite and expanding validation/error-handling coverage.

## 👨‍💻 Author

**Marcin Potoczny**  
[GitHub profile](https://github.com/marpot)
