import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, hash_password, verify_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User, UserRole


TEST_JWT_SECRET = "test-only-secret-key-that-is-not-used-outside-tests"


class AdminUserEndpointTests(unittest.TestCase):
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
        self.employee = self._create_user("employee@example.com", UserRole.EMPLOYEE)

    def tearDown(self) -> None:
        self.client.close()
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()
        self.environment.stop()

    def _create_user(
        self,
        email: str,
        role: UserRole,
        *,
        password: str = "existing-password",
        is_active: bool = True,
    ) -> User:
        db = self.session_factory()
        try:
            user = User(
                email=email,
                password_hash=hash_password(password),
                role=role,
                is_active=is_active,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            db.expunge(user)
            return user
        finally:
            db.close()

    def _headers(self, user: User) -> dict[str, str]:
        token = create_access_token(subject=str(user.id))
        return {"Authorization": f"Bearer {token}"}

    def _user_payload(
        self,
        email: str = "new-user@example.com",
        role: str = "EMPLOYEE",
    ) -> dict[str, object]:
        return {
            "email": email,
            "password": "secure-password",
            "role": role,
            "is_active": True,
        }

    def test_unauthenticated_access_is_rejected(self) -> None:
        response = self.client.get("/api/v1/admin/users")

        self.assertEqual(response.status_code, 401)

    def test_manager_access_is_rejected(self) -> None:
        response = self.client.get(
            "/api/v1/admin/users",
            headers=self._headers(self.manager),
        )

        self.assertEqual(response.status_code, 403)

    def test_employee_access_is_rejected(self) -> None:
        response = self.client.get(
            "/api/v1/admin/users",
            headers=self._headers(self.employee),
        )

        self.assertEqual(response.status_code, 403)

    def test_admin_lists_users_in_id_order_without_password_hashes(self) -> None:
        response = self.client.get(
            "/api/v1/admin/users",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(
            [item["id"] for item in body],
            [self.admin.id, self.manager.id, self.employee.id],
        )
        self.assertTrue(all("password" not in item for item in body))
        self.assertTrue(all("password_hash" not in item for item in body))

    def test_admin_gets_user_without_password_hash(self) -> None:
        response = self.client.get(
            f"/api/v1/admin/users/{self.manager.id}",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], self.manager.email)
        self.assertNotIn("password_hash", response.json())

    def test_missing_user_detail_returns_404(self) -> None:
        response = self.client.get(
            "/api/v1/admin/users/999",
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 404)

    def test_admin_creates_each_supported_role(self) -> None:
        for role in UserRole:
            with self.subTest(role=role):
                response = self.client.post(
                    "/api/v1/admin/users",
                    json=self._user_payload(
                        email=f"new-{role.value.lower()}@example.com",
                        role=role.value,
                    ),
                    headers=self._headers(self.admin),
                )

                self.assertEqual(response.status_code, 201)
                self.assertEqual(response.json()["role"], role.value)
                self.assertNotIn("password", response.json())
                self.assertNotIn("password_hash", response.json())

    def test_created_password_is_hashed(self) -> None:
        response = self.client.post(
            "/api/v1/admin/users",
            json=self._user_payload(),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)
        db = self.session_factory()
        try:
            user = db.get(User, response.json()["id"])
            self.assertNotEqual(user.password_hash, "secure-password")
            self.assertTrue(verify_password("secure-password", user.password_hash))
        finally:
            db.close()

    def test_create_can_set_account_inactive(self) -> None:
        payload = self._user_payload()
        payload["is_active"] = False

        response = self.client.post(
            "/api/v1/admin/users",
            json=payload,
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.json()["is_active"])

    def test_duplicate_email_on_create_returns_conflict(self) -> None:
        response = self.client.post(
            "/api/v1/admin/users",
            json=self._user_payload(email=self.manager.email),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 409)

    def test_invalid_email_on_create_is_rejected(self) -> None:
        response = self.client.post(
            "/api/v1/admin/users",
            json=self._user_payload(email="not-an-email"),
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_blank_password_on_create_is_rejected(self) -> None:
        payload = self._user_payload()
        payload["password"] = "        "

        response = self.client.post(
            "/api/v1/admin/users",
            json=payload,
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_admin_updates_another_users_email(self) -> None:
        response = self.client.patch(
            f"/api/v1/admin/users/{self.employee.id}",
            json={"email": "updated@example.com"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "updated@example.com")

    def test_admin_changes_another_users_role(self) -> None:
        response = self.client.patch(
            f"/api/v1/admin/users/{self.employee.id}",
            json={"role": "MANAGER"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["role"], "MANAGER")

    def test_admin_deactivates_and_reactivates_another_user(self) -> None:
        headers = self._headers(self.admin)

        deactivate_response = self.client.patch(
            f"/api/v1/admin/users/{self.employee.id}",
            json={"is_active": False},
            headers=headers,
        )
        reactivate_response = self.client.patch(
            f"/api/v1/admin/users/{self.employee.id}",
            json={"is_active": True},
            headers=headers,
        )

        self.assertEqual(deactivate_response.status_code, 200)
        self.assertFalse(deactivate_response.json()["is_active"])
        self.assertEqual(reactivate_response.status_code, 200)
        self.assertTrue(reactivate_response.json()["is_active"])

    def test_missing_user_update_returns_404(self) -> None:
        response = self.client.patch(
            "/api/v1/admin/users/999",
            json={"email": "missing@example.com"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 404)

    def test_duplicate_email_on_update_returns_conflict(self) -> None:
        response = self.client.patch(
            f"/api/v1/admin/users/{self.employee.id}",
            json={"email": self.manager.email},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 409)

    def test_required_update_fields_cannot_be_null(self) -> None:
        headers = self._headers(self.admin)

        for field in ("email", "role", "is_active"):
            with self.subTest(field=field):
                response = self.client.patch(
                    f"/api/v1/admin/users/{self.employee.id}",
                    json={field: None},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 422)

    def test_admin_cannot_deactivate_own_account(self) -> None:
        response = self.client.patch(
            f"/api/v1/admin/users/{self.admin.id}",
            json={"is_active": False},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("deactivate", response.json()["detail"])

    def test_admin_cannot_remove_own_admin_role(self) -> None:
        response = self.client.patch(
            f"/api/v1/admin/users/{self.admin.id}",
            json={"role": "MANAGER"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("ADMIN role", response.json()["detail"])

    def test_admin_can_change_own_email(self) -> None:
        response = self.client.patch(
            f"/api/v1/admin/users/{self.admin.id}",
            json={"email": "renamed-admin@example.com"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "renamed-admin@example.com")

    def test_admin_sets_another_users_password(self) -> None:
        response = self.client.put(
            f"/api/v1/admin/users/{self.employee.id}/password",
            json={"password": "new-secure-password"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("password", response.json())
        self.assertNotIn("password_hash", response.json())
        db = self.session_factory()
        try:
            user = db.get(User, self.employee.id)
            self.assertNotEqual(user.password_hash, "new-secure-password")
            self.assertTrue(verify_password("new-secure-password", user.password_hash))
            self.assertFalse(verify_password("existing-password", user.password_hash))
        finally:
            db.close()

    def test_admin_can_change_own_password(self) -> None:
        response = self.client.put(
            f"/api/v1/admin/users/{self.admin.id}/password",
            json={"password": "new-admin-password"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 200)

    def test_blank_password_reset_is_rejected(self) -> None:
        response = self.client.put(
            f"/api/v1/admin/users/{self.employee.id}/password",
            json={"password": "        "},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 422)

    def test_missing_password_reset_target_returns_404(self) -> None:
        response = self.client.put(
            "/api/v1/admin/users/999/password",
            json={"password": "new-secure-password"},
            headers=self._headers(self.admin),
        )

        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
