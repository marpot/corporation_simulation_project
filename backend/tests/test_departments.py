import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.department import Department
from app.models.user import User, UserRole

TEST_JWT_SECRET = "test-only-secret-key-that-is-not-used-outside-tests"


class DepartmentEndpointTests(unittest.TestCase):
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
                password_hash="unused-in-department-tests",
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

    def _create_department(self, name: str = "Engineering") -> Department:
        db = self.session_factory()
        try:
            department = Department(
                name=name,
                description="Builds and operates company software.",
                active=True,
            )
            db.add(department)
            db.commit()
            db.refresh(department)
            db.expunge(department)
            return department
        finally:
            db.close()

    def _headers(self, user: User) -> dict[str, str]:
        token = create_access_token(subject=str(user.id))
        return {"Authorization": f"Bearer {token}"}

    def _department_payload(self, name: str = "Product") -> dict[str, object]:
        return {
            "name": name,
            "description": "Owns product direction.",
            "active": True,
        }

    def test_authenticated_user_can_list_departments(self) -> None:
        department = self._create_department()

        response = self.client.get(
            "/api/v1/departments",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.json()], [department.id])

    def test_unauthenticated_request_is_rejected(self) -> None:
        response = self.client.get("/api/v1/departments")

        self.assertEqual(response.status_code, 401)

    def test_department_can_be_retrieved_by_id(self) -> None:
        department = self._create_department()

        response = self.client.get(
            f"/api/v1/departments/{department.id}",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Engineering")

    def test_missing_department_returns_404(self) -> None:
        response = self.client.get(
            "/api/v1/departments/999",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 404)

    def test_admin_can_create_department(self) -> None:
        response = self.client.post(
            "/api/v1/departments",
            json=self._department_payload("  Product  "),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["name"], "Product")
        self.assertTrue(response.json()["active"])

    def test_manager_can_create_department(self) -> None:
        response = self.client.post(
            "/api/v1/departments",
            json=self._department_payload(),
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 201)

    def test_manager_can_update_department(self) -> None:
        department = self._create_department()

        response = self.client.patch(
            f"/api/v1/departments/{department.id}",
            json={"name": "Platform Engineering", "active": False},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Platform Engineering")
        self.assertFalse(response.json()["active"])

    def test_employee_role_cannot_create_department(self) -> None:
        response = self.client.post(
            "/api/v1/departments",
            json=self._department_payload(),
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 403)

    def test_employee_role_cannot_update_department(self) -> None:
        department = self._create_department()

        response = self.client.patch(
            f"/api/v1/departments/{department.id}",
            json={"name": "Operations"},
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 403)

    def test_employee_role_cannot_delete_department(self) -> None:
        department = self._create_department()

        response = self.client.delete(
            f"/api/v1/departments/{department.id}",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 403)

    def test_department_description_can_be_cleared(self) -> None:
        department = self._create_department()

        response = self.client.patch(
            f"/api/v1/departments/{department.id}",
            json={"description": None},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["description"])

    def test_department_can_be_deleted(self) -> None:
        department = self._create_department()

        response = self.client.delete(
            f"/api/v1/departments/{department.id}",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            self.assertIsNone(db.get(Department, department.id))
        finally:
            db.close()

    def test_duplicate_name_is_rejected(self) -> None:
        self._create_department("Finance")

        response = self.client.post(
            "/api/v1/departments",
            json=self._department_payload("Finance"),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["detail"], "Department could not be saved")

    def test_blank_name_is_rejected(self) -> None:
        response = self.client.post(
            "/api/v1/departments",
            json=self._department_payload("   "),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_name_and_active_cannot_be_set_to_null(self) -> None:
        department = self._create_department()
        headers = self._headers(self.manager)

        for field in ("name", "active"):
            with self.subTest(field=field):
                response = self.client.patch(
                    f"/api/v1/departments/{department.id}",
                    json={field: None},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
