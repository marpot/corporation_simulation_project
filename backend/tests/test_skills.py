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
from app.models.employee import Employee, Seniority
from app.models.employee_skill import EmployeeSkill
from app.models.project import Project, ProjectStatus
from app.models.project_skill import ProjectSkill
from app.models.skill import Skill, SkillLevel
from app.models.user import User, UserRole

TEST_JWT_SECRET = "test-only-secret-key-that-is-not-used-outside-tests"


class SkillEndpointTests(unittest.TestCase):
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
        self.employee = self._create_employee()
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
                password_hash="unused-in-skill-tests",
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

    def _create_employee(self) -> Employee:
        db = self.session_factory()
        try:
            employee = Employee(
                first_name="Jan",
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

    def _create_project(self) -> Project:
        db = self.session_factory()
        try:
            project = Project(
                name="Atlas",
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

    def _create_skill(self, name: str = "Python") -> Skill:
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

    def _create_employee_skill(
        self,
        skill: Skill,
        level: SkillLevel = SkillLevel.ADVANCED,
    ) -> EmployeeSkill:
        db = self.session_factory()
        try:
            employee_skill = EmployeeSkill(
                employee_id=self.employee.id,
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

    def _create_project_skill(
        self,
        skill: Skill,
        required_level: SkillLevel = SkillLevel.INTERMEDIATE,
    ) -> ProjectSkill:
        db = self.session_factory()
        try:
            project_skill = ProjectSkill(
                project_id=self.project.id,
                skill_id=skill.id,
                required_level=required_level,
            )
            db.add(project_skill)
            db.commit()
            db.refresh(project_skill)
            db.expunge(project_skill)
            return project_skill
        finally:
            db.close()

    def _headers(self, user: User) -> dict[str, str]:
        token = create_access_token(subject=str(user.id))
        return {"Authorization": f"Bearer {token}"}

    def test_authenticated_employee_can_list_and_read_skills(self) -> None:
        first = self._create_skill("Python")
        second = self._create_skill("React")
        headers = self._headers(self.regular_user)

        list_response = self.client.get("/api/v1/skills", headers=headers)
        detail_response = self.client.get(f"/api/v1/skills/{second.id}", headers=headers)

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual([item["id"] for item in list_response.json()], [first.id, second.id])
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()["name"], "React")

    def test_admin_can_create_skill(self) -> None:
        response = self.client.post(
            "/api/v1/skills",
            json={"name": "  Python  "},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["name"], "Python")

    def test_manager_can_update_skill(self) -> None:
        skill = self._create_skill()

        response = self.client.patch(
            f"/api/v1/skills/{skill.id}",
            json={"name": "Python 3"},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Python 3")

    def test_admin_can_delete_skill(self) -> None:
        skill = self._create_skill()

        response = self.client.delete(
            f"/api/v1/skills/{skill.id}",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            self.assertIsNone(db.get(Skill, skill.id))
        finally:
            db.close()

    def test_blank_skill_name_is_rejected(self) -> None:
        response = self.client.post(
            "/api/v1/skills",
            json={"name": "   "},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_duplicate_skill_name_returns_conflict(self) -> None:
        self._create_skill("Python")

        response = self.client.post(
            "/api/v1/skills",
            json={"name": "Python"},
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["detail"], "Skill name already exists")

    def test_duplicate_skill_name_on_update_returns_conflict(self) -> None:
        self._create_skill("Python")
        react = self._create_skill("React")

        response = self.client.patch(
            f"/api/v1/skills/{react.id}",
            json={"name": "Python"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 409)

    def test_missing_skill_returns_404(self) -> None:
        response = self.client.get(
            "/api/v1/skills/999",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(response.status_code, 404)

    def test_employee_role_cannot_write_skills(self) -> None:
        skill = self._create_skill()
        headers = self._headers(self.regular_user)

        create_response = self.client.post(
            "/api/v1/skills",
            json={"name": "React"},
            headers=headers,
        )
        
        update_response = self.client.patch(
            f"/api/v1/skills/{skill.id}", json={"name": "Python 3"}, headers=headers,
        )
        delete_response = self.client.delete(f"/api/v1/skills/{skill.id}", headers=headers)

        self.assertEqual(create_response.status_code, 403)
        self.assertEqual(update_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)

    def test_unauthenticated_skill_access_is_rejected(self) -> None:
        self.assertEqual(self.client.get("/api/v1/skills").status_code, 401)

    def test_assign_and_list_employee_skill_with_name(self) -> None:
        skill = self._create_skill("Python")
        headers = self._headers(self.manager)

        create_response = self.client.post(
            f"/api/v1/employees/{self.employee.id}/skills",
            json={"skill_id": skill.id, "level": "ADVANCED"},
            headers=headers,
        )
        list_response = self.client.get(
            f"/api/v1/employees/{self.employee.id}/skills",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.json(), {
            "skill_id": skill.id,
            "skill_name": "Python",
            "level": "ADVANCED",
        })
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.json()[0]["skill_name"], "Python")

    def test_update_employee_skill_level(self) -> None:
        skill = self._create_skill()
        self._create_employee_skill(skill)

        response = self.client.patch(
            f"/api/v1/employees/{self.employee.id}/skills/{skill.id}",
            json={"level": "EXPERT"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["level"], "EXPERT")

    def test_remove_employee_skill(self) -> None:
        skill = self._create_skill()
        self._create_employee_skill(skill)

        response = self.client.delete(
            f"/api/v1/employees/{self.employee.id}/skills/{skill.id}",
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 204)

    def test_duplicate_employee_skill_returns_conflict(self) -> None:
        skill = self._create_skill()
        self._create_employee_skill(skill)

        response = self.client.post(
            f"/api/v1/employees/{self.employee.id}/skills",
            json={"skill_id": skill.id, "level": "EXPERT"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 409)

    def test_employee_skill_missing_employee_and_skill_are_handled(self) -> None:
        skill = self._create_skill()
        headers = self._headers(self.manager)

        missing_employee = self.client.post(
            "/api/v1/employees/999/skills",
            json={"skill_id": skill.id, "level": "BEGINNER"},
            headers=headers,
        )
        missing_skill = self.client.post(
            f"/api/v1/employees/{self.employee.id}/skills",
            json={"skill_id": 999, "level": "BEGINNER"},
            headers=headers,
        )

        self.assertEqual(missing_employee.status_code, 404)
        self.assertEqual(missing_employee.json()["detail"], "Employee not found")
        self.assertEqual(missing_skill.status_code, 404)
        self.assertEqual(missing_skill.json()["detail"], "Skill not found")

    def test_employee_role_cannot_write_employee_skills(self) -> None:
        skill = self._create_skill()
        self._create_employee_skill(skill)
        headers = self._headers(self.regular_user)
        path = f"/api/v1/employees/{self.employee.id}/skills"

        create_response = self.client.post(
            path, json={"skill_id": skill.id, "level": "EXPERT"}, headers=headers,
        )
        update_response = self.client.patch(
            f"{path}/{skill.id}", json={"level": "EXPERT"}, headers=headers,
        )
        delete_response = self.client.delete(f"{path}/{skill.id}", headers=headers)

        self.assertEqual(create_response.status_code, 403)
        self.assertEqual(update_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)

    def test_deleting_employee_cascades_employee_skills(self) -> None:
        skill = self._create_skill()
        self._create_employee_skill(skill)

        response = self.client.delete(
            f"/api/v1/employees/{self.employee.id}",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            self.assertIsNone(db.get(EmployeeSkill, (self.employee.id, skill.id)))
        finally:
            db.close()

    def test_add_and_list_project_skill_with_name(self) -> None:
        skill = self._create_skill("React")
        headers = self._headers(self.manager)

        create_response = self.client.post(
            f"/api/v1/projects/{self.project.id}/skills",
            json={"skill_id": skill.id, "required_level": "INTERMEDIATE"},
            headers=headers,
        )
        list_response = self.client.get(
            f"/api/v1/projects/{self.project.id}/skills",
            headers=self._headers(self.regular_user),
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.json(), {
            "skill_id": skill.id,
            "skill_name": "React",
            "required_level": "INTERMEDIATE",
        })
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.json()[0]["skill_name"], "React")

    def test_update_project_required_level(self) -> None:
        skill = self._create_skill()
        self._create_project_skill(skill)

        response = self.client.patch(
            f"/api/v1/projects/{self.project.id}/skills/{skill.id}",
            json={"required_level": "EXPERT"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["required_level"], "EXPERT")

    def test_remove_project_skill(self) -> None:
        skill = self._create_skill()
        self._create_project_skill(skill)

        response = self.client.delete(
            f"/api/v1/projects/{self.project.id}/skills/{skill.id}",
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 204)

    def test_duplicate_project_skill_returns_conflict(self) -> None:
        skill = self._create_skill()
        self._create_project_skill(skill)

        response = self.client.post(
            f"/api/v1/projects/{self.project.id}/skills",
            json={"skill_id": skill.id, "required_level": "EXPERT"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 409)

    def test_project_skill_missing_project_and_skill_are_handled(self) -> None:
        skill = self._create_skill()
        headers = self._headers(self.manager)

        missing_project = self.client.post(
            "/api/v1/projects/999/skills",
            json={"skill_id": skill.id, "required_level": "BEGINNER"},
            headers=headers,
        )
        missing_skill = self.client.post(
            f"/api/v1/projects/{self.project.id}/skills",
            json={"skill_id": 999, "required_level": "BEGINNER"},
            headers=headers,
        )

        self.assertEqual(missing_project.status_code, 404)
        self.assertEqual(missing_project.json()["detail"], "Project not found")
        self.assertEqual(missing_skill.status_code, 404)
        self.assertEqual(missing_skill.json()["detail"], "Skill not found")

    def test_employee_role_cannot_write_project_skills(self) -> None:
        skill = self._create_skill()
        self._create_project_skill(skill)
        headers = self._headers(self.regular_user)
        path = f"/api/v1/projects/{self.project.id}/skills"

        create_response = self.client.post(
            path, json={"skill_id": skill.id, "required_level": "EXPERT"}, headers=headers,
        )
        update_response = self.client.patch(
            f"{path}/{skill.id}", json={"required_level": "EXPERT"}, headers=headers,
        )
        delete_response = self.client.delete(f"{path}/{skill.id}", headers=headers)

        self.assertEqual(create_response.status_code, 403)
        self.assertEqual(update_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)

    def test_deleting_project_cascades_project_skills(self) -> None:
        skill = self._create_skill()
        self._create_project_skill(skill)

        response = self.client.delete(
            f"/api/v1/projects/{self.project.id}",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            self.assertIsNone(db.get(ProjectSkill, (self.project.id, skill.id)))
        finally:
            db.close()

    def test_deleting_skill_cascades_both_association_types(self) -> None:
        skill = self._create_skill()
        self._create_employee_skill(skill)
        self._create_project_skill(skill)

        response = self.client.delete(
            f"/api/v1/skills/{skill.id}",
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 204)
        db = self.session_factory()
        try:
            self.assertIsNone(db.get(EmployeeSkill, (self.employee.id, skill.id)))
            self.assertIsNone(db.get(ProjectSkill, (self.project.id, skill.id)))
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
