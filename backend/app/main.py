from fastapi import FastAPI

from app.api.v1.admin_users import router as admin_users_router
from app.api.v1.assignments import router as assignments_router
from app.api.v1.auth import router as auth_router
from app.api.v1.departments import router as departments_router
from app.api.v1.employees import router as employees_router
from app.api.v1.projects import router as projects_router

app = FastAPI()

app.include_router(admin_users_router, prefix="/api/v1")
app.include_router(assignments_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(departments_router, prefix="/api/v1")
app.include_router(employees_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
