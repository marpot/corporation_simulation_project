# Corporation Resource Management

Full-stack resource allocation and project staffing application built with FastAPI, React, TypeScript and PostgreSQL.

The project models a practical company workflow: employees belong to departments, work on projects through time-bounded assignments, and have skills that can be compared with project requirements. The next application stages use this data to calculate capacity, detect over-allocation and provide explainable employee-to-project matching.

The project is also a portfolio environment for demonstrating backend development, frontend development, automated testing and a complete DevOps delivery path.

## Current Features

### Authentication and authorization

- JWT authentication
- role-based access control
- ADMIN, MANAGER and EMPLOYEE roles
- protected frontend routes
- dedicated administration console
- admin user management

### Organization management

- employee CRUD
- department CRUD
- employee-to-department assignment
- active/inactive states
- employee seniority and weekly capacity

### Project management

- project CRUD
- project status and date ranges
- employee-to-project assignments
- allocation percentage
- assignment start/end dates
- ongoing assignments

### Skills

- central skills catalog
- employee skill levels
- project skill requirements
- shared proficiency levels: BEGINNER, INTERMEDIATE, ADVANCED and EXPERT
- role-aware management UI
- database constraints preventing duplicate employee/project skill associations

### Frontend

- React + TypeScript application
- responsive SCSS interface
- EN/PL translations
- loading, error, empty and retry states
- normal application and separate Admin Console
- API-backed Employees, Departments, Projects, Assignments and Skills pages

### Testing

The project contains automated backend and frontend tests covering authentication, RBAC, CRUD operations, validation, relationships, assignments, skills and UI/service behavior.

Current verified suites after the Skills implementation:

- backend: 151 tests passing
- frontend: 64 tests passing
- frontend lint passing
- production build/typecheck passing
- Alembic schema check passing

## Technology Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- PostgreSQL
- PyJWT
- Pytest

### Frontend

- React
- TypeScript
- Vite
- SCSS
- Vitest
- React Testing Library

### DevOps

Currently used:

- Docker
- Docker Compose
- GitHub Actions

Planned before the project is considered complete:

- Kubernetes
- Helm
- Terraform

## Domain Model

The main business relationships are:

- a User provides authentication and an application role
- an Employee may belong to a Department
- an Employee may have multiple Skills with proficiency levels
- a Project may require multiple Skills at minimum levels
- an Assignment connects an Employee with a Project for a period and allocation percentage

This model provides the data needed for the remaining resource-planning functionality without introducing additional domain modules.

## API

The backend exposes versioned REST endpoints under:

`/api/v1`

Main API areas:

- `/auth`
- `/admin/users`
- `/employees`
- `/departments`
- `/projects`
- `/assignments`
- `/skills`
- employee skills
- project skill requirements

Interactive FastAPI documentation is available locally at:

`http://localhost:8000/docs`

## Repository Structure

```text
.
├── backend/
│   ├── alembic/          # Database migrations
│   ├── app/
│   │   ├── api/          # FastAPI endpoints
│   │   ├── core/         # Security and configuration
│   │   ├── db/           # Database setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   └── tests/
├── frontend/             # React + TypeScript application
├── infrastructure/
│   ├── kubernetes/
│   └── helm/
├── .github/workflows/
└── docker-compose.yml
```

## Local Development

Create the environment file:

```bash
cp .env.example .env
```

Configure the required PostgreSQL and application settings in `.env`, then start the development environment:

```bash
docker compose up --build
```

Backend:

`http://localhost:8000`

Swagger UI:

`http://localhost:8000/docs`

Stop the environment with:

```bash
docker compose down
```

## Database Migrations

Database schema changes are managed with Alembic.

From the `backend` directory:

```bash
alembic upgrade head
```

Migrations are versioned in the repository. Existing migrations are not edited when the schema evolves.

## Development Status

The core data-management part of the application is implemented.

Completed:

- [x] Authentication and RBAC
- [x] Employees
- [x] Departments
- [x] Employee-to-department relationship
- [x] Projects
- [x] Admin Console and user management
- [x] Resource assignments
- [x] Employee skills and project skill requirements

Remaining scope:

- [ ] Capacity calculation and over-allocation detection
- [ ] Explainable employee-to-project matching
- [ ] Replace dashboard mock data with real KPIs
- [ ] Final backend/frontend quality pass
- [ ] Finalize full-stack Docker setup and CI/CD
- [ ] Kubernetes deployment
- [ ] Helm packaging
- [ ] Terraform infrastructure
- [ ] Final README, architecture documentation and screenshots

The scope is intentionally fixed. The project will not be expanded with unrelated modules before these remaining stages are completed.

## Matching Approach

Employee-to-project matching will be deterministic and explainable.

The planned calculation will use data already present in the system:

- employee skills and proficiency
- project skill requirements
- employee assignments
- available capacity

The goal is to make every recommendation understandable instead of hiding business rules behind an opaque score.

## Project Completion Plan

The remaining work is intentionally limited to seven stages:

1. Capacity and over-allocation
2. Explainable matching
3. Real dashboard KPIs
4. Code quality and final automated testing
5. Docker and CI/CD finalization
6. Kubernetes, Helm and Terraform
7. Portfolio polish: documentation, architecture overview and screenshots

After these stages, the project is considered complete.

## Purpose

This is not intended to be a generic CRUD demo.

The project demonstrates how a business domain can evolve from relational modelling and REST APIs into a tested full-stack application and then into a containerized, orchestrated and reproducible deployment.

The focus is on a clear domain, maintainable implementation, automated verification and a deliberately bounded project scope.
