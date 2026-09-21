# Corporation Management System

Full-stack application for managing company structure, employees, departments, projects, and internal business processes.

The project is designed as a practical corporate management platform and as an environment for developing backend, frontend, DevOps, and infrastructure skills using a production-oriented architecture.

## Project Goals

Corporation Management System aims to provide a central place for managing:

* employees and organizational structure,
* departments and managers,
* company projects and assignments,
* roles and permissions,
* operational data displayed through a management dashboard,
* external data from GitHub and NBP,
* employee-to-project matching based on skills and project requirements.

The application is being developed incrementally, with each part kept independently testable and deployable.

## Architecture

```text
                     ┌──────────────────┐
                     │   React + TS     │
                     │     Frontend     │
                     └────────┬─────────┘
                              │
                         REST API
                              │
                     ┌────────▼─────────┐
                     │     FastAPI      │
                     │     Backend      │
                     └───────┬──────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        PostgreSQL       GitHub API       NBP API
```

The backend follows a layered structure separating API endpoints, database models, schemas, business logic, and external integrations.

## Technology Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* Alembic
* PostgreSQL
* Pytest

### Frontend

* React
* TypeScript
* Vite

### DevOps & Infrastructure

* Docker
* Docker Compose
* Kubernetes
* Helm
* GitHub Actions

## Repository Structure

```text
.
├── backend/
│   ├── alembic/             # Database migrations
│   ├── app/
│   │   ├── api/             # REST API endpoints
│   │   ├── core/            # Application configuration and security
│   │   ├── db/              # Database configuration
│   │   ├── integrations/    # External services
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   └── tests/
│
├── frontend/                # React + TypeScript application
│
├── infrastructure/
│   ├── kubernetes/          # Kubernetes manifests
│   └── helm/                # Helm chart
│
├── .github/workflows/       # CI/CD
└── docker-compose.yml
```

## Planned Core Features

### Organization Management

Management of employees, departments, reporting relationships, and organizational roles.

### Project Management

Projects can contain information such as:

* project status,
* required skills,
* assigned employees,
* project ownership,
* start and end dates.

### Authentication & Authorization

JWT-based authentication with role-based access control for different levels of access to the system.

### Management Dashboard

The React dashboard will provide an overview of company data such as:

* employee distribution,
* department statistics,
* active projects,
* project staffing,
* organizational metrics.

### GitHub Integration

GitHub API integration will provide development-related project information such as repository activity and selected repository statistics.

### NBP Integration

Integration with the National Bank of Poland API will provide exchange-rate data that can be used for financial and project-related calculations.

### Employee–Project Matching

The application will include a matching mechanism for suggesting employees for projects based on employee skills and project requirements.

The feature will evolve from deterministic skill matching toward NLP-based similarity analysis.

## Local Development

Create the local environment file:

```bash
cp .env.example .env
```

Set the PostgreSQL credentials in `.env`, then start the application:

```bash
docker compose up --build
```

The FastAPI backend is available at:

```text
http://localhost:8000
```

Interactive Swagger API documentation:

```text
http://localhost:8000/docs
```

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

New schema changes should be introduced through migrations rather than creating database tables during application startup.

## Development Status

The project is currently under active development.

The repository structure and Docker development environment have been prepared. The next development stages focus on redesigning the domain model and expanding the FastAPI API before implementing the React dashboard and infrastructure layer.

## Roadmap

```text
Repository cleanup
        ↓
Domain model
        ↓
REST API
        ↓
Automated tests
        ↓
React dashboard
        ↓
GitHub & NBP integrations
        ↓
Employee–Project matching
        ↓
Dockerized full stack
        ↓
Kubernetes
        ↓
Helm
        ↓
CI/CD
```

## Purpose

This project focuses on building a complete application rather than an isolated CRUD demo.

Its development covers the full lifecycle of a modern web application: domain modelling, REST API design, relational databases, automated testing, frontend development, external API integrations, containerization, orchestration, and CI/CD.
