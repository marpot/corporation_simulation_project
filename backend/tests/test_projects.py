import os
import unittest
from datetime import date
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole


TEST_JWT_SECRET = "test-only-secret-key-that-is-not-used-outside-tests"


class ProjectEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.environment = patch.dict(os.environ, {"JWT_SECRET_KEY": TEST_JWT_SECRET})
        self.environment.start()

        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.session_factory = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine,
        )
        Base.metadata.create_all(bind=self.engine)

        def override_get_db():
            db = self.session_factory()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)
        self.admin = self._create_user("admin@example.com", UserRole.ADMIN)
        self.manager = self._create_user("manager@example.com", UserRole.MANAGER)
        self.regular_user = self._create_user("employee@example.com", UserRole.EMPLOYEE)

    def tearDown(self) -> None:
        self.client.close()
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()
        self.environment.stop()

    def _create_user(self, email: str, role: UserRole) -> User:
        db = self.session_factory()
        try:
            user = User(
                email=email,
                password_hash="unused-in-project-tests",
                role=role,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            db.expunge(user)
            return user
        finally:
            db.close()

    def _create_project(
        self,
        name: str = "Atlas Platform",
        *,
        start_date: date = date(2026, 10, 1),
        end_date: date | None = date(2026, 10, 31),
    ) -> Project:
        db = self.session_factory()
        try:
            project = Project(
                name=name,
                description="Internal platform delivery.",
                status=ProjectStatus.ACTIVE,
                start_date=start_date,
                end_date=end_date,
                active=True,
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            db.expunge(project)
            return project
        finally:
            db.close()

    def _headers(self, user: User) -> dict[str, str]:
        token = create_access_token(subject=str(user.id))
        return {"Authorization": f"Bearer {token}"}

    def _project_payload(
        self,
        *,
        name: str = "Customer Portal",
        start_date: str = "2026-10-01",
        end_date: str | None = "2026-10-31",
    ) -> dict[str, object]:
        return {
            "name": name,
            "description": "Customer self-service project.",
            "status": "PLANNED",
            "start_date": start_date,
            "end_date": end_date,
            "active": True,
        }

    def test_authenticated_user_can_list_projects(self) -> None:
        first = self._create_project("First")
        second = self._create_project("Second")

        response = self.client.get(
            "/api/v1/projects",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.json()], [first.id, second.id])

    def test_unauthenticated_request_is_rejected(self) -> None:
        response = self.client.get("/api/v1/projects")

        self.assertEqual(response.status_code, 401)

    def test_project_can_be_retrieved_by_id(self) -> None:
        project = self._create_project()

        response = self.client.get(
            f"/api/v1/projects/{project.id}",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Atlas Platform")

    def test_missing_project_returns_404(self) -> None:
        response = self.client.get(
            "/api/v1/projects/999",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 404)

    def test_admin_can_create_project(self) -> None:
        payload = self._project_payload(name="  Customer Portal  ")

        response = self.client.post(
            "/api/v1/projects",
            json=payload,
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["name"], "Customer Portal")
        self.assertEqual(response.json()["status"], "PLANNED")

    def test_manager_can_create_project(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json=self._project_payload(),
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 201)

    def test_manager_can_update_project(self) -> None:
        project = self._create_project()

        response = self.client.patch(
            f"/api/v1/projects/{project.id}",
            json={"name": "Atlas Next", "status": "ON_HOLD", "active": False},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Atlas Next")
        self.assertEqual(response.json()["status"], "ON_HOLD")
        self.assertFalse(response.json()["active"])

    def test_employee_role_cannot_create_project(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json=self._project_payload(),
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 403)

    def test_employee_role_cannot_update_project(self) -> None:
        project = self._create_project()

        response = self.client.patch(
            f"/api/v1/projects/{project.id}",
            json={"status": "COMPLETED"},
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 403)

    def test_employee_role_cannot_delete_project(self) -> None:
        project = self._create_project()

        response = self.client.delete(
            f"/api/v1/projects/{project.id}",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 403)

    def test_project_can_be_deleted(self) -> None:
        project = self._create_project()

        response = self.client.delete(
            f"/api/v1/projects/{project.id}",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            self.assertIsNone(db.get(Project, project.id))
        finally:
            db.close()

    def test_blank_name_is_rejected(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json=self._project_payload(name="   "),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_invalid_status_is_rejected(self) -> None:
        payload = self._project_payload()
        payload["status"] = "IN_PROGRESS"

        response = self.client.post(
            "/api/v1/projects",
            json=payload,
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_end_date_before_start_date_is_rejected_on_create(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json=self._project_payload(start_date="2026-10-10", end_date="2026-10-09"),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_end_date_equal_to_start_date_is_accepted(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json=self._project_payload(start_date="2026-10-10", end_date="2026-10-10"),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)

    def test_end_date_after_start_date_is_accepted(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json=self._project_payload(start_date="2026-10-10", end_date="2026-11-10"),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)

    def test_end_date_may_be_null(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json=self._project_payload(end_date=None),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.json()["end_date"])

    def test_description_may_be_null(self) -> None:
        project = self._create_project()

        response = self.client.patch(
            f"/api/v1/projects/{project.id}",
            json={"description": None},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["description"])

    def test_required_patch_fields_cannot_be_set_to_null(self) -> None:
        project = self._create_project()
        headers = self._headers(self.manager)

        for field in ("name", "status", "start_date", "active"):
            with self.subTest(field=field):
                response = self.client.patch(
                    f"/api/v1/projects/{project.id}",
                    json={field: None},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 422)

    def test_patch_start_date_validates_resulting_range(self) -> None:
        project = self._create_project()

        response = self.client.patch(
            f"/api/v1/projects/{project.id}",
            json={"start_date": "2026-11-15"},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 422)

    def test_patch_end_date_validates_resulting_range(self) -> None:
        project = self._create_project()

        response = self.client.patch(
            f"/api/v1/projects/{project.id}",
            json={"end_date": "2026-09-30"},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 422)

    def test_patch_can_clear_end_date(self) -> None:
        project = self._create_project()

        response = self.client.patch(
            f"/api/v1/projects/{project.id}",
            json={"end_date": None},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["end_date"])

    def test_duplicate_names_are_allowed(self) -> None:
        self._create_project("Shared Name")

        response = self.client.post(
            "/api/v1/projects",
            json=self._project_payload(name="Shared Name"),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)


if __name__ == "__main__":
    unittest.main()
