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
from app.models.employee_skill import EmployeeSkill
from app.models.project import Project, ProjectStatus
from app.models.project_skill import ProjectSkill
from app.models.skill import Skill, SkillLevel
from app.models.user import User, UserRole
from app.services.matching import meets_requirement

TEST_JWT_SECRET = "test-only-secret-key-that-is-not-used-outside-tests"
TARGET_DATE = date(2026, 10, 15)


def test_employee_with_higher_skill_level_meets_requirement():
    result = meets_requirement(
        employee_level=SkillLevel.EXPERT,
        required_level=SkillLevel.ADVANCED,
    )

    assert result is True


def test_employee_with_lower_skill_level_meets_requirement():
    result = meets_requirement(
        employee_level=SkillLevel.BEGINNER,
        required_level=SkillLevel.INTERMEDIATE,
    )

    assert result is False


def test_employee_with_equal_skill_level_meets_requirement():
    result = meets_requirement(
        employee_level=SkillLevel.ADVANCED,
        required_level=SkillLevel.ADVANCED,
    )

    assert result is True


class MatchingEndpointTests(unittest.TestCase):
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
                password_hash="unused-in-matching-tests",
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

    def _create_project(self, name: str = "Atlas") -> Project:
        db = self.session_factory()
        try:
            project = Project(
                name=name,
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

    def _create_skill(self, name: str) -> Skill:
        db = self.session_factory()
        try:
            skill = Skill(name=name)
            db.add(skill)
            db.commit()
            db.refresh(skill)
            db.expunge(skill)
            return skill
        finally:
            db.close()

    def _add_requirement(
        self,
        skill: Skill,
        required_level: SkillLevel,
    ) -> ProjectSkill:
        db = self.session_factory()
        try:
            requirement = ProjectSkill(
                project_id=self.project.id,
                skill_id=skill.id,
                required_level=required_level,
            )
            db.add(requirement)
            db.commit()
            db.refresh(requirement)
            db.expunge(requirement)
            return requirement
        finally:
            db.close()

    def _add_employee_skill(
        self,
        employee: Employee,
        skill: Skill,
        level: SkillLevel,
    ) -> EmployeeSkill:
        db = self.session_factory()
        try:
            employee_skill = EmployeeSkill(
                employee_id=employee.id,
                skill_id=skill.id,
                level=level,
            )
            db.add(employee_skill)
            db.commit()
            db.refresh(employee_skill)
            db.expunge(employee_skill)
            return employee_skill
        finally:
            db.close()

    def _create_assignment(
        self,
        employee: Employee,
        allocation_percent: int,
        *,
        start_date: date = date(2026, 10, 1),
        end_date: date | None = date(2026, 10, 31),
    ) -> Assignment:
        db = self.session_factory()
        try:
            assignment = Assignment(
                employee_id=employee.id,
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

    def _matching_response(
        self,
        *,
        user: User | None = None,
        project_id: int | None = None,
        target_date: date | None = TARGET_DATE,
    ):
        params = {"date": target_date.isoformat()} if target_date is not None else None
        headers = self._headers(user or self.admin)
        return self.client.get(
            f"/api/v1/projects/{project_id or self.project.id}/matching",
            params=params,
            headers=headers,
        )

    def test_multiple_requirements_include_matched_and_insufficient_explanations(
        self,
    ) -> None:
        employee = self._create_employee("Anna", "Nowak")
        python = self._create_skill("Python")
        react = self._create_skill("React")
        self._add_requirement(python, SkillLevel.ADVANCED)
        self._add_requirement(react, SkillLevel.INTERMEDIATE)
        self._add_employee_skill(employee, python, SkillLevel.EXPERT)
        self._add_employee_skill(employee, react, SkillLevel.BEGINNER)

        response = self._matching_response()

        self.assertEqual(response.status_code, 200)
        result = response.json()[0]
        self.assertEqual(result["requirements_met"], 1)
        self.assertEqual(result["requirements_total"], 2)
        self.assertEqual(result["matched_requirements"], [{
            "skill_id": python.id,
            "skill_name": "Python",
            "required_level": "ADVANCED",
            "employee_level": "EXPERT",
            "met": True,
        }])
        self.assertEqual(result["unmet_requirements"], [{
            "skill_id": react.id,
            "skill_name": "React",
            "required_level": "INTERMEDIATE",
            "employee_level": "BEGINNER",
            "met": False,
        }])

    def test_missing_employee_skill_has_null_level(self) -> None:
        self._create_employee("Anna", "Nowak")
        python = self._create_skill("Python")
        self._add_requirement(python, SkillLevel.BEGINNER)

        response = self._matching_response()

        result = response.json()[0]
        self.assertEqual(result["requirements_met"], 0)
        self.assertEqual(result["unmet_requirements"][0]["employee_level"], None)
        self.assertFalse(result["unmet_requirements"][0]["met"])

    def test_capacity_is_included_using_target_date_semantics(self) -> None:
        employee = self._create_employee("Anna", "Nowak")
        self._create_assignment(employee, 60)
        self._create_assignment(
            employee,
            30,
            start_date=date(2026, 10, 16),
            end_date=None,
        )

        response = self._matching_response()

        result = response.json()[0]
        self.assertEqual(result["allocated_percent"], 60)
        self.assertEqual(result["available_percent"], 40)
        self.assertEqual(result["capacity_status"], "AVAILABLE")

    def test_requirements_met_is_the_primary_ranking_criterion(self) -> None:
        qualified = self._create_employee("Qualified", "Employee")
        available = self._create_employee("Available", "Employee")
        python = self._create_skill("Python")
        self._add_requirement(python, SkillLevel.BEGINNER)
        self._add_employee_skill(qualified, python, SkillLevel.BEGINNER)
        self._create_assignment(qualified, 100)

        response = self._matching_response()

        self.assertEqual(
            [item["employee_id"] for item in response.json()],
            [qualified.id, available.id],
        )

    def test_available_capacity_is_the_secondary_ranking_criterion(self) -> None:
        busier = self._create_employee("Busy", "Employee")
        freer = self._create_employee("Free", "Employee")
        python = self._create_skill("Python")
        self._add_requirement(python, SkillLevel.INTERMEDIATE)
        self._add_employee_skill(busier, python, SkillLevel.INTERMEDIATE)
        self._add_employee_skill(freer, python, SkillLevel.INTERMEDIATE)
        self._create_assignment(busier, 70)
        self._create_assignment(freer, 20)

        response = self._matching_response()

        self.assertEqual(
            [item["employee_id"] for item in response.json()],
            [freer.id, busier.id],
        )

    def test_employee_id_is_the_deterministic_tie_breaker(self) -> None:
        first = self._create_employee("First", "Employee")
        second = self._create_employee("Second", "Employee")
        python = self._create_skill("Python")
        self._add_requirement(python, SkillLevel.BEGINNER)
        self._add_employee_skill(first, python, SkillLevel.BEGINNER)
        self._add_employee_skill(second, python, SkillLevel.BEGINNER)

        response = self._matching_response()

        self.assertEqual(
            [item["employee_id"] for item in response.json()],
            [first.id, second.id],
        )

    def test_project_without_requirements_ranks_active_employees_by_capacity(self) -> None:
        busier = self._create_employee("Busy", "Employee")
        freer = self._create_employee("Free", "Employee")
        self._create_assignment(busier, 50)

        response = self._matching_response()

        results = response.json()
        self.assertEqual([item["employee_id"] for item in results], [freer.id, busier.id])
        self.assertTrue(all(item["requirements_met"] == 0 for item in results))
        self.assertTrue(all(item["requirements_total"] == 0 for item in results))
        self.assertTrue(all(item["matched_requirements"] == [] for item in results))
        self.assertTrue(all(item["unmet_requirements"] == [] for item in results))

    def test_inactive_employees_are_not_matching_candidates(self) -> None:
        active = self._create_employee("Active", "Employee")
        self._create_employee("Inactive", "Employee", active=False)

        response = self._matching_response()

        self.assertEqual(
            [item["employee_id"] for item in response.json()],
            [active.id],
        )

    def test_omitted_date_uses_current_date_at_request_time(self) -> None:
        employee = self._create_employee("Anna", "Nowak")
        self._create_assignment(
            employee,
            75,
            start_date=TARGET_DATE,
            end_date=TARGET_DATE,
        )

        with patch("app.api.v1.projects.date") as date_mock:
            date_mock.today.return_value = TARGET_DATE
            response = self._matching_response(target_date=None)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["allocated_percent"], 75)

    def test_missing_project_returns_404(self) -> None:
        response = self._matching_response(project_id=999)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Project not found")

    def test_every_authenticated_role_can_read_matching(self) -> None:
        for user in (self.admin, self.manager, self.regular_user):
            with self.subTest(role=user.role):
                response = self._matching_response(user=user)
                self.assertEqual(response.status_code, 200)

    def test_unauthenticated_request_is_rejected(self) -> None:
        response = self.client.get(
            f"/api/v1/projects/{self.project.id}/matching",
            params={"date": TARGET_DATE.isoformat()},
        )

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
