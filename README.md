# Corporation Management System

This repository is the monorepo foundation for a corporation management system. The existing FastAPI backend is preserved while directories are reserved for a future React frontend and deployment infrastructure.

## Repository layout

```text
.
├── backend/              # FastAPI application, Alembic, and future pytest suite
├── frontend/             # Reserved for React + TypeScript + Vite
├── infrastructure/
│   ├── kubernetes/       # Reserved for Kubernetes resources
│   └── helm/             # Reserved for a future Helm chart
├── .github/workflows/    # Existing automation
└── docker-compose.yml    # Local backend + PostgreSQL environment
```

No React application, Kubernetes manifests, or Helm chart has been generated at this stage.

## Local development with Docker Compose

Copy the environment template and replace its example password:

```bash
cp .env.example .env
docker compose up --build
```

The backend is exposed at `http://localhost:8000` by default. Local values in `.env` are ignored by Git.

Stop the environment with:

```bash
docker compose down
```

## Backend development

Create a virtual environment outside source control, install the pinned dependencies, and provide `DATABASE_URL`:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://corporation_user:your_password@localhost:5432/corporation_db
uvicorn app.main:app --reload
```

Run database migrations from `backend/`:

```bash
alembic upgrade head
```

Alembic is the schema-management mechanism; application startup does not create tables automatically.

## Current scope

This cleanup establishes project boundaries and preserves the existing employee API behavior. Authentication, RBAC, projects, dashboards, audit logging, GitHub/NBP integrations, the frontend, and deployment manifests are future work.

See [CLEANUP_REPORT.md](CLEANUP_REPORT.md) for the changes, known issues, and recommended next task.
