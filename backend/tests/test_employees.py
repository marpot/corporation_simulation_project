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
from app.models.employee import Employee, Seniority
from app.models.user import User, UserRole


TEST_JWT_SECRET = "test-only-secret-key-that-is-not-used-outside-tests"


class EmployeeEndpointTests(unittest.TestCase):
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
                password_hash="unused-in-employee-tests",
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

    def _create_employee(self, first_name: str = "Jan") -> Employee:
        db = self.session_factory()
        try:
            employee = Employee(
                first_name=first_name,
                last_name="Kowalski",
                position="Backend Engineer",
                seniority=Seniority.SENIOR,
                weekly_capacity=40,
                active=True,
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)
            db.expunge(employee)
            return employee
        finally:
            db.close()

    def _headers(self, user: User) -> dict[str, str]:
        token = create_access_token(subject=str(user.id))
        return {"Authorization": f"Bearer {token}"}

    def _employee_payload(self) -> dict[str, object]:
        return {
            "first_name": "Adam",
            "last_name": "Nowak",
            "position": "Product Manager",
            "seniority": "MID",
            "weekly_capacity": 40,
            "active": True,
        }

    def test_authenticated_user_can_list_employees(self) -> None:
        employee = self._create_employee()

        response = self.client.get(
            "/api/v1/employees",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.json()], [employee.id])

    def test_unauthenticated_request_is_rejected(self) -> None:
        response = self.client.get("/api/v1/employees")

        self.assertEqual(response.status_code, 401)

    def test_employee_can_be_retrieved_by_id(self) -> None:
        employee = self._create_employee()

        response = self.client.get(
            f"/api/v1/employees/{employee.id}",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["first_name"], "Jan")

    def test_missing_employee_returns_404(self) -> None:
        response = self.client.get(
            "/api/v1/employees/999",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 404)

    def test_admin_can_create_employee(self) -> None:
        response = self.client.post(
            "/api/v1/employees",
            json=self._employee_payload(),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["seniority"], "MID")
        self.assertTrue(response.json()["active"])

    def test_manager_can_create_employee(self) -> None:
        response = self.client.post(
            "/api/v1/employees",
            json=self._employee_payload(),
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 201)

    def test_manager_can_update_employee(self) -> None:
        employee = self._create_employee()

        response = self.client.patch(
            f"/api/v1/employees/{employee.id}",
            json={"position": "Engineering Lead", "seniority": "LEAD"},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["position"], "Engineering Lead")
        self.assertEqual(response.json()["seniority"], "LEAD")

    def test_employee_role_cannot_create_update_or_delete(self) -> None:
        employee = self._create_employee()
        headers = self._headers(self.regular_user)

        create_response = self.client.post(
            "/api/v1/employees",
            json=self._employee_payload(),
            headers=headers,
        )
        update_response = self.client.patch(
            f"/api/v1/employees/{employee.id}",
            json={"position": "Engineering Lead"},
            headers=headers,
        )
        delete_response = self.client.delete(
            f"/api/v1/employees/{employee.id}",
            headers=headers,
        )

        self.assertEqual(create_response.status_code, 403)
        self.assertEqual(update_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)

    def test_employee_can_be_deleted(self) -> None:
        employee = self._create_employee()

        response = self.client.delete(
            f"/api/v1/employees/{employee.id}",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            self.assertIsNone(db.get(Employee, employee.id))
        finally:
            db.close()

    def test_validation_rejects_invalid_weekly_capacity(self) -> None:
        payload = self._employee_payload()
        payload["weekly_capacity"] = 0

        response = self.client.post(
            "/api/v1/employees",
            json=payload,
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_validation_rejects_blank_required_text_values(self) -> None:
        for field in ("first_name", "last_name", "position"):
            with self.subTest(field=field):
                payload = self._employee_payload()
                payload[field] = "   "

                response = self.client.post(
                    "/api/v1/employees",
                    json=payload,
                    headers=self._headers(self.admin),
                )

                self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
