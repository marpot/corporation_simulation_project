# Repository Cleanup Report

## Repository cleanup

- Removed the committed `env/` virtual environment and all tracked Python bytecode/cache directories.
- Expanded `.gitignore` for Python environments, caches, coverage/build outputs, frontend dependencies/build outputs, IDE metadata, operating-system files, logs, and temporary files.
- Kept `.env.example` as the safe configuration template while continuing to ignore `.env` and all other environment variants.
- Removed the broken legacy `init_db.py` script, which bypassed Alembic and referenced a non-existent model name.
- Moved legacy backend notes into `backend/docs/` instead of leaving backend-specific files at the monorepo root.

## New structure

The repository is now organized as a monorepo:

- `backend/` contains the FastAPI application, SQLAlchemy models, Pydantic schemas, services, Alembic migrations, Dockerfile, dependencies, and the future test location.
- `frontend/` is reserved for the future React, TypeScript, and Vite application; it currently contains documentation only.
- `infrastructure/kubernetes/` and `infrastructure/helm/` are tracked placeholders. They intentionally contain no manifests or charts.
- `.github/workflows/` retains the existing workflow, with only its Docker build context adjusted.
- Root-level Compose and environment files coordinate local development.

## Existing backend moved

- `app/` moved to `backend/app/`.
- The former `app/controllers/employee_controller.py` moved to `backend/app/api/v1/employee_controller.py`.
- Database metadata and session handling moved from `app/base.py` and `app/database.py` to `backend/app/db/base.py` and `backend/app/db/session.py`.
- `alembic/` and `alembic.ini` moved to `backend/`.
- `requirements.txt` and `Dockerfile` moved to `backend/`.
- Application imports, Alembic imports, Docker Compose paths, and the existing workflow's Docker build path were updated for the new locations.

## Security changes

- Removed the hardcoded PostgreSQL password from Docker Compose, Alembic configuration, and the Alembic runtime fallback.
- Compose now requires database identity and connection values from the local environment/`.env` file.
- Database URLs are no longer logged, preventing accidental credential disclosure.
- `.env` remains ignored; only `.env.example` is committed.

The `change_me` value in `.env.example` is an explicit non-secret placeholder and must be replaced locally.

## Architectural issues found

The cleanup safely consolidated three SQLAlchemy declarative bases into `app.db.base.Base`, moved the request-scoped session dependency into `app.db.session`, removed the unused async `databases` layer, and removed runtime `Base.metadata.create_all()`. Alembic is now the only intended schema-management mechanism.

The following issues remain for deliberate backend/domain refactoring:

- All three existing Alembic revisions have empty upgrade/downgrade bodies, so a fresh database cannot currently be built from migration history.
- The models need a domain review: CEO and manager are separate tables rather than roles, and relationship/nullability/deletion behavior is not clearly defined.
- Existing employee creation requires a CEO and a discriminator `type`, but the request schema/API contract does not establish robust role semantics.
- Schema modules contain circular/forward references, Pydantic v1-style validators/configuration, mutable list defaults, and inconsistent naming.
- The employee controller contains unreachable response-mapping code and imports that are no longer needed.
- Error handling, transaction rollback, service boundaries, and endpoint coverage are incomplete.
- There is no pytest suite yet. `backend/tests/` is prepared, but fake tests were not added.
- Dependency packaging remains a single pinned requirements file; development/test dependency separation should be decided later.
- The existing GitHub Actions workflow uses older action versions, relies on a custom `GHCR_TOKEN`, has no lint/test/migration checks, and publishes only a backend image. Only the required path adjustment was made in this task.
- PostgreSQL 14 is retained to avoid an unrelated runtime upgrade; its supported target version should be reviewed later.

## Planned architecture

Application flow:

```text
React
  ↓
FastAPI
  ↓
PostgreSQL
```

External integrations:

```text
FastAPI → GitHub API
FastAPI → NBP API
```

Future deployment:

```text
Ingress
  ↓
Frontend + Backend
  ↓
PostgreSQL
```

These components are architectural targets only. No frontend, integration, authentication, authorization, Kubernetes, or Helm functionality was implemented during cleanup.

## Next recommended task

Refactor the backend/domain foundation before starting the frontend or Kubernetes work. Begin by defining the employee/manager/CEO domain and API contracts, repairing the Alembic baseline, modernizing the Pydantic schemas, and adding focused pytest coverage around the preserved behavior.
