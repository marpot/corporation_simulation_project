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
from app.models.employee import Employee, Seniority
from app.models.user import User, UserRole


TEST_JWT_SECRET = "test-only-secret-key-that-is-not-used-outside-tests"


class EmployeeDepartmentEndpointTests(unittest.TestCase):
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
                password_hash="unused-in-employee-department-tests",
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

    def _create_department(self, name: str) -> Department:
        db = self.session_factory()
        try:
            department = Department(name=name, active=True)
            db.add(department)
            db.commit()
            db.refresh(department)
            db.expunge(department)
            return department
        finally:
            db.close()

    def _create_employee(self, department_id: int | None = None) -> Employee:
        db = self.session_factory()
        try:
            employee = Employee(
                first_name="Jan",
                last_name="Kowalski",
                position="Backend Engineer",
                seniority=Seniority.SENIOR,
                weekly_capacity=40,
                active=True,
                department_id=department_id,
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

    def _employee_payload(self, department_id: int | None = None) -> dict[str, object]:
        return {
            "first_name": "Adam",
            "last_name": "Nowak",
            "position": "Product Manager",
            "seniority": "MID",
            "weekly_capacity": 40,
            "active": True,
            "department_id": department_id,
        }

    def test_create_employee_with_department(self) -> None:
        department = self._create_department("Product")

        response = self.client.post(
            "/api/v1/employees",
            json=self._employee_payload(department.id),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["department_id"], department.id)

    def test_create_employee_without_department(self) -> None:
        response = self.client.post(
            "/api/v1/employees",
            json=self._employee_payload(),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.json()["department_id"])

    def test_create_rejects_nonexistent_department(self) -> None:
        response = self.client.post(
            "/api/v1/employees",
            json=self._employee_payload(999),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "Department not found")

    def test_update_rejects_nonexistent_department(self) -> None:
        employee = self._create_employee()

        response = self.client.patch(
            f"/api/v1/employees/{employee.id}",
            json={"department_id": 999},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "Department not found")

    def test_update_employee_department(self) -> None:
        department = self._create_department("Engineering")
        employee = self._create_employee()

        response = self.client.patch(
            f"/api/v1/employees/{employee.id}",
            json={"department_id": department.id},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["department_id"], department.id)

    def test_move_employee_between_departments(self) -> None:
        engineering = self._create_department("Engineering")
        product = self._create_department("Product")
        employee = self._create_employee(engineering.id)

        response = self.client.patch(
            f"/api/v1/employees/{employee.id}",
            json={"department_id": product.id},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["department_id"], product.id)

    def test_clear_employee_department_with_null(self) -> None:
        department = self._create_department("Engineering")
        employee = self._create_employee(department.id)

        response = self.client.patch(
            f"/api/v1/employees/{employee.id}",
            json={"department_id": None},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["department_id"])

    def test_employee_detail_exposes_department_association(self) -> None:
        department = self._create_department("Engineering")
        employee = self._create_employee(department.id)

        response = self.client.get(
            f"/api/v1/employees/{employee.id}",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["department_id"], department.id)

    def test_deleting_department_preserves_employee_and_clears_association(self) -> None:
        department = self._create_department("Engineering")
        employee = self._create_employee(department.id)

        response = self.client.delete(
            f"/api/v1/departments/{department.id}",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            preserved_employee = db.get(Employee, employee.id)
            self.assertIsNotNone(preserved_employee)
            self.assertIsNone(preserved_employee.department_id)
        finally:
            db.close()

    def test_existing_employee_authorization_rules_apply_to_department_assignment(self) -> None:
        department = self._create_department("Engineering")
        employee = self._create_employee()

        manager_response = self.client.patch(
            f"/api/v1/employees/{employee.id}",
            json={"department_id": department.id},
            headers=self._headers(self.manager),
        )
        employee_response = self.client.patch(
            f"/api/v1/employees/{employee.id}",
            json={"department_id": None},
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(manager_response.status_code, 200)
        self.assertEqual(employee_response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
