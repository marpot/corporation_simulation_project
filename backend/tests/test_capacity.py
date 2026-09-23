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
from app.models.assignment import Assignment
from app.models.employee import Employee, Seniority
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.schemas.capacity import CapacityStatus
from app.services.capacity import calculate_capacity


TEST_JWT_SECRET = "test-only-secret-key-that-is-not-used-outside-tests"
TARGET_DATE = date(2026, 10, 15)


class CapacityCalculationTests(unittest.TestCase):
    def test_capacity_status_and_available_percentage(self) -> None:
        expectations = (
            (0, 100, CapacityStatus.AVAILABLE),
            (60, 40, CapacityStatus.AVAILABLE),
            (100, 0, CapacityStatus.FULLY_ALLOCATED),
            (130, 0, CapacityStatus.OVERALLOCATED),
        )

        for allocated, available, expected_status in expectations:
            with self.subTest(allocated=allocated):
                result = calculate_capacity(1, "Jan Kowalski", allocated)
                self.assertEqual(result.allocated_percent, allocated)
                self.assertEqual(result.available_percent, available)
                self.assertEqual(result.status, expected_status)


class CapacityEndpointTests(unittest.TestCase):
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
        self.employee = self._create_employee("Jan", "Kowalski")
        self.project = self._create_project()

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
                password_hash="unused-in-capacity-tests",
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

    def _create_employee(
        self,
        first_name: str,
        last_name: str,
        *,
        active: bool = True,
    ) -> Employee:
        db = self.session_factory()
        try:
            employee = Employee(
                first_name=first_name,
                last_name=last_name,
                position="Engineer",
                seniority=Seniority.SENIOR,
                weekly_capacity=40,
                active=active,
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)
            db.expunge(employee)
            return employee
        finally:
            db.close()

    def _create_project(self) -> Project:
        db = self.session_factory()
        try:
            project = Project(
                name="Atlas",
                description=None,
                status=ProjectStatus.ACTIVE,
                start_date=date(2026, 1, 1),
                end_date=None,
                active=True,
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            db.expunge(project)
            return project
        finally:
            db.close()

    def _create_assignment(
        self,
        allocation_percent: int,
        *,
        employee_id: int | None = None,
        start_date: date = date(2026, 10, 1),
        end_date: date | None = date(2026, 10, 31),
    ) -> Assignment:
        db = self.session_factory()
        try:
            assignment = Assignment(
                employee_id=employee_id or self.employee.id,
                project_id=self.project.id,
                allocation_percent=allocation_percent,
                start_date=start_date,
                end_date=end_date,
            )
            db.add(assignment)
            db.commit()
            db.refresh(assignment)
            db.expunge(assignment)
            return assignment
        finally:
            db.close()

    def _headers(self, user: User) -> dict[str, str]:
        token = create_access_token(subject=str(user.id))
        return {"Authorization": f"Bearer {token}"}

    def _list_capacity(self, target_date: date = TARGET_DATE):
        return self.client.get(
            "/api/v1/capacity/employees",
            params={"date": target_date.isoformat()},
            headers=self._headers(self.admin),
        )

    def _employee_result(self, target_date: date = TARGET_DATE) -> dict[str, object]:
        response = self._list_capacity(target_date)
        self.assertEqual(response.status_code, 200)
        return response.json()[0]

    def test_employee_without_assignments_is_available(self) -> None:
        result = self._employee_result()

        self.assertEqual(result["employee_id"], self.employee.id)
        self.assertEqual(result["employee_name"], "Jan Kowalski")
        self.assertEqual(result["allocated_percent"], 0)
        self.assertEqual(result["available_percent"], 100)
        self.assertEqual(result["status"], "AVAILABLE")

    def test_employee_below_one_hundred_percent_is_available(self) -> None:
        self._create_assignment(60)

        result = self._employee_result()

        self.assertEqual(result["allocated_percent"], 60)
        self.assertEqual(result["available_percent"], 40)
        self.assertEqual(result["status"], "AVAILABLE")

    def test_employee_at_one_hundred_percent_is_fully_allocated(self) -> None:
        self._create_assignment(100)

        result = self._employee_result()

        self.assertEqual(result["allocated_percent"], 100)
        self.assertEqual(result["available_percent"], 0)
        self.assertEqual(result["status"], "FULLY_ALLOCATED")

    def test_multiple_assignments_can_make_employee_overallocated(self) -> None:
        self._create_assignment(80)
        self._create_assignment(50)

        result = self._employee_result()

        self.assertEqual(result["allocated_percent"], 130)
        self.assertEqual(result["available_percent"], 0)
        self.assertEqual(result["status"], "OVERALLOCATED")

    def test_multiple_active_assignments_are_summed(self) -> None:
        self._create_assignment(50)
        self._create_assignment(30)

        result = self._employee_result()

        self.assertEqual(result["allocated_percent"], 80)

    def test_future_assignment_does_not_count(self) -> None:
        self._create_assignment(
            60,
            start_date=date(2026, 10, 16),
            end_date=None,
        )

        self.assertEqual(self._employee_result()["allocated_percent"], 0)

    def test_expired_assignment_does_not_count(self) -> None:
        self._create_assignment(
            60,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 10, 14),
        )

        self.assertEqual(self._employee_result()["allocated_percent"], 0)

    def test_assignment_counts_on_start_date(self) -> None:
        self._create_assignment(
            45,
            start_date=TARGET_DATE,
            end_date=date(2026, 11, 1),
        )

        self.assertEqual(self._employee_result()["allocated_percent"], 45)

    def test_assignment_counts_on_end_date(self) -> None:
        self._create_assignment(
            45,
            start_date=date(2026, 10, 1),
            end_date=TARGET_DATE,
        )

        self.assertEqual(self._employee_result()["allocated_percent"], 45)

    def test_assignment_without_end_date_counts_after_start(self) -> None:
        self._create_assignment(
            45,
            start_date=date(2026, 1, 1),
            end_date=None,
        )

        self.assertEqual(self._employee_result()["allocated_percent"], 45)

    def test_date_query_parameter_changes_result(self) -> None:
        self._create_assignment(
            70,
            start_date=date(2026, 11, 1),
            end_date=None,
        )

        october = self._employee_result(date(2026, 10, 31))
        november = self._employee_result(date(2026, 11, 1))

        self.assertEqual(october["allocated_percent"], 0)
        self.assertEqual(november["allocated_percent"], 70)

    def test_omitted_date_uses_current_date_at_request_time(self) -> None:
        self._create_assignment(
            70,
            start_date=TARGET_DATE,
            end_date=TARGET_DATE,
        )

        with patch("app.api.v1.capacity.date") as date_mock:
            date_mock.today.return_value = TARGET_DATE
            response = self.client.get(
                "/api/v1/capacity/employees",
                headers=self._headers(self.admin),
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["allocated_percent"], 70)

    def test_invalid_date_query_is_rejected(self) -> None:
        response = self.client.get(
            "/api/v1/capacity/employees",
            params={"date": "not-a-date"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_inactive_employee_is_omitted_from_overview_but_available_by_id(self) -> None:
        inactive_employee = self._create_employee("Anna", "Nowak", active=False)

        list_response = self._list_capacity()
        detail_response = self.client.get(
            f"/api/v1/capacity/employees/{inactive_employee.id}",
            params={"date": TARGET_DATE.isoformat()},
            headers=self._headers(self.admin),
        )

        self.assertEqual(
            [item["employee_id"] for item in list_response.json()],
            [self.employee.id],
        )
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()["employee_id"], inactive_employee.id)

    def test_single_employee_endpoint_uses_same_capacity_calculation(self) -> None:
        self._create_assignment(75)

        response = self.client.get(
            f"/api/v1/capacity/employees/{self.employee.id}",
            params={"date": TARGET_DATE.isoformat()},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["allocated_percent"], 75)
        self.assertEqual(response.json()["available_percent"], 25)

    def test_missing_employee_returns_404(self) -> None:
        response = self.client.get(
            "/api/v1/capacity/employees/999",
            params={"date": TARGET_DATE.isoformat()},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Employee not found")

    def test_every_authenticated_role_can_read_capacity(self) -> None:
        for user in (self.admin, self.manager, self.regular_user):
            with self.subTest(role=user.role):
                response = self.client.get(
                    "/api/v1/capacity/employees",
                    params={"date": TARGET_DATE.isoformat()},
                    headers=self._headers(user),
                )
                self.assertEqual(response.status_code, 200)

    def test_unauthenticated_request_is_rejected(self) -> None:
        response = self.client.get(
            "/api/v1/capacity/employees",
            params={"date": TARGET_DATE.isoformat()},
        )

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
