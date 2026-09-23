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


TEST_JWT_SECRET = "test-only-secret-key-that-is-not-used-outside-tests"


class AssignmentEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.environment = patch.dict(os.environ, {"JWT_SECRET_KEY": TEST_JWT_SECRET})
        self.environment.start()

        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        with self.engine.connect() as connection:
            connection.exec_driver_sql("PRAGMA foreign_keys=ON")
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
        self.employee = self._create_employee("Jan")
        self.project = self._create_project("Atlas")

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
                password_hash="unused-in-assignment-tests",
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

    def _create_employee(self, first_name: str) -> Employee:
        db = self.session_factory()
        try:
            employee = Employee(
                first_name=first_name,
                last_name="Kowalski",
                position="Engineer",
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

    def _create_project(self, name: str) -> Project:
        db = self.session_factory()
        try:
            project = Project(
                name=name,
                description=None,
                status=ProjectStatus.ACTIVE,
                start_date=date(2026, 10, 1),
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
        *,
        employee_id: int | None = None,
        project_id: int | None = None,
        allocation_percent: int = 50,
        start_date: date = date(2026, 10, 1),
        end_date: date | None = date(2026, 10, 31),
    ) -> Assignment:
        db = self.session_factory()
        try:
            assignment = Assignment(
                employee_id=employee_id or self.employee.id,
                project_id=project_id or self.project.id,
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

    def _payload(
        self,
        *,
        employee_id: int | None = None,
        project_id: int | None = None,
        allocation_percent: int = 50,
        start_date: str = "2026-10-01",
        end_date: str | None = "2026-10-31",
    ) -> dict[str, object]:
        return {
            "employee_id": employee_id or self.employee.id,
            "project_id": project_id or self.project.id,
            "allocation_percent": allocation_percent,
            "start_date": start_date,
            "end_date": end_date,
        }

    def test_admin_can_create_valid_assignment(self) -> None:
        response = self.client.post(
            "/api/v1/assignments",
            json=self._payload(),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["employee_id"], self.employee.id)
        self.assertEqual(response.json()["project_id"], self.project.id)
        self.assertEqual(response.json()["allocation_percent"], 50)

    def test_manager_can_create_assignment_with_nullable_end_date(self) -> None:
        response = self.client.post(
            "/api/v1/assignments",
            json=self._payload(end_date=None),
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.json()["end_date"])

    def test_create_rejects_unknown_employee(self) -> None:
        response = self.client.post(
            "/api/v1/assignments",
            json=self._payload(employee_id=999),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "Employee not found")

    def test_create_rejects_unknown_project(self) -> None:
        response = self.client.post(
            "/api/v1/assignments",
            json=self._payload(project_id=999),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "Project not found")

    def test_create_rejects_allocation_below_one(self) -> None:
        response = self.client.post(
            "/api/v1/assignments",
            json=self._payload(allocation_percent=0),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_create_rejects_allocation_above_one_hundred(self) -> None:
        response = self.client.post(
            "/api/v1/assignments",
            json=self._payload(allocation_percent=101),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_create_rejects_end_date_before_start_date(self) -> None:
        response = self.client.post(
            "/api/v1/assignments",
            json=self._payload(start_date="2026-10-10", end_date="2026-10-09"),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_authenticated_employee_can_list_assignments_in_id_order(self) -> None:
        first = self._create_assignment(allocation_percent=25)
        second = self._create_assignment(allocation_percent=75)

        response = self.client.get(
            "/api/v1/assignments",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.json()], [first.id, second.id])

    def test_authenticated_employee_can_get_assignment(self) -> None:
        assignment = self._create_assignment()

        response = self.client.get(
            f"/api/v1/assignments/{assignment.id}",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], assignment.id)

    def test_unknown_assignment_returns_404(self) -> None:
        response = self.client.get(
            "/api/v1/assignments/999",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 404)

    def test_manager_can_update_allocation(self) -> None:
        assignment = self._create_assignment()

        response = self.client.patch(
            f"/api/v1/assignments/{assignment.id}",
            json={"allocation_percent": 80},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["allocation_percent"], 80)

    def test_assignment_can_move_to_another_employee(self) -> None:
        assignment = self._create_assignment()
        other_employee = self._create_employee("Anna")

        response = self.client.patch(
            f"/api/v1/assignments/{assignment.id}",
            json={"employee_id": other_employee.id},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["employee_id"], other_employee.id)

    def test_assignment_can_move_to_another_project(self) -> None:
        assignment = self._create_assignment()
        other_project = self._create_project("Borealis")

        response = self.client.patch(
            f"/api/v1/assignments/{assignment.id}",
            json={"project_id": other_project.id},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["project_id"], other_project.id)

    def test_update_rejects_unknown_employee_and_project(self) -> None:
        assignment = self._create_assignment()
        headers = self._headers(self.manager)

        employee_response = self.client.patch(
            f"/api/v1/assignments/{assignment.id}",
            json={"employee_id": 999},
            headers=headers,
        )
        project_response = self.client.patch(
            f"/api/v1/assignments/{assignment.id}",
            json={"project_id": 999},
            headers=headers,
        )

        self.assertEqual(employee_response.status_code, 422)
        self.assertEqual(employee_response.json()["detail"], "Employee not found")
        self.assertEqual(project_response.status_code, 422)
        self.assertEqual(project_response.json()["detail"], "Project not found")

    def test_update_dates_validates_resulting_range(self) -> None:
        assignment = self._create_assignment()

        invalid_response = self.client.patch(
            f"/api/v1/assignments/{assignment.id}",
            json={"start_date": "2026-11-01"},
            headers=self._headers(self.manager),
        )
        valid_response = self.client.patch(
            f"/api/v1/assignments/{assignment.id}",
            json={"start_date": "2026-10-05", "end_date": "2026-11-15"},
            headers=self._headers(self.manager),
        )

        self.assertEqual(invalid_response.status_code, 422)
        self.assertEqual(valid_response.status_code, 200)
        self.assertEqual(valid_response.json()["start_date"], "2026-10-05")
        self.assertEqual(valid_response.json()["end_date"], "2026-11-15")

    def test_update_can_clear_end_date_with_explicit_null(self) -> None:
        assignment = self._create_assignment()

        response = self.client.patch(
            f"/api/v1/assignments/{assignment.id}",
            json={"end_date": None},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["end_date"])

    def test_admin_can_delete_assignment(self) -> None:
        assignment = self._create_assignment()

        response = self.client.delete(
            f"/api/v1/assignments/{assignment.id}",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            self.assertIsNone(db.get(Assignment, assignment.id))
        finally:
            db.close()

    def test_deleting_employee_cascades_assignment_deletion(self) -> None:
        assignment = self._create_assignment()

        response = self.client.delete(
            f"/api/v1/employees/{self.employee.id}",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            self.assertIsNone(db.get(Assignment, assignment.id))
        finally:
            db.close()

    def test_deleting_project_cascades_assignment_deletion(self) -> None:
        assignment = self._create_assignment()

        response = self.client.delete(
            f"/api/v1/projects/{self.project.id}",
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            self.assertIsNone(db.get(Assignment, assignment.id))
        finally:
            db.close()

    def test_combined_allocation_above_one_hundred_is_allowed(self) -> None:
        headers = self._headers(self.manager)

        first_response = self.client.post(
            "/api/v1/assignments",
            json=self._payload(allocation_percent=70),
            headers=headers,
        )
        second_response = self.client.post(
            "/api/v1/assignments",
            json=self._payload(allocation_percent=60),
            headers=headers,
        )

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 201)

    def test_employee_role_cannot_create_update_or_delete(self) -> None:
        assignment = self._create_assignment()
        headers = self._headers(self.regular_user)

        create_response = self.client.post(
            "/api/v1/assignments",
            json=self._payload(),
            headers=headers,
        )
        update_response = self.client.patch(
            f"/api/v1/assignments/{assignment.id}",
            json={"allocation_percent": 25},
            headers=headers,
        )
        delete_response = self.client.delete(
            f"/api/v1/assignments/{assignment.id}",
            headers=headers,
        )

        self.assertEqual(create_response.status_code, 403)
        self.assertEqual(update_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)

    def test_unauthenticated_request_is_rejected(self) -> None:
        response = self.client.get("/api/v1/assignments")

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
