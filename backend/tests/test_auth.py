import os
import unittest
from datetime import timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, decode_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User, UserRole

TEST_JWT_SECRET = "test-only-secret-key-that-is-not-used-outside-tests"


class AccessTokenTests(unittest.TestCase):
    def setUp(self) -> None:
        self.environment = patch.dict(os.environ, {"JWT_SECRET_KEY": TEST_JWT_SECRET})
        self.environment.start()

    def tearDown(self) -> None:
        self.environment.stop()

    def test_access_token_can_be_created_and_decoded(self) -> None:
        token = create_access_token(subject="123")

        self.assertEqual(decode_access_token(token), "123")

    def test_expired_access_token_is_rejected(self) -> None:
        token = create_access_token(subject="123", expires_delta=timedelta(seconds=-1))

        with self.assertRaises(ExpiredSignatureError):
            decode_access_token(token)

    def test_malformed_access_token_is_rejected(self) -> None:
        with self.assertRaises(InvalidTokenError):
            decode_access_token("not-a-jwt")


class AuthenticationEndpointTests(unittest.TestCase):
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
        self.user = self._create_user()

    def tearDown(self) -> None:
        self.client.close()
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()
        self.environment.stop()

    def _create_user(self, *, is_active: bool = True) -> User:
        db = self.session_factory()
        try:
            user = User(
                email="person@example.com",
                password_hash=hash_password("correct-password"),
                role=UserRole.EMPLOYEE,
                is_active=is_active,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            db.expunge(user)
            return user
        finally:
            db.close()

    def test_successful_login_returns_bearer_access_token(self) -> None:
        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": self.user.email, "password": "correct-password"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["access_token"])
        self.assertEqual(response.json()["token_type"], "bearer")

    def test_incorrect_password_returns_401(self) -> None:
        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": self.user.email, "password": "incorrect-password"},
        )

        self.assertEqual(response.status_code, 401)

    def test_unknown_email_returns_401(self) -> None:
        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": "unknown@example.com", "password": "correct-password"},
        )

        self.assertEqual(response.status_code, 401)

    def test_inactive_user_cannot_authenticate(self) -> None:
        db = self.session_factory()
        try:
            user = db.get(User, self.user.id)
            user.is_active = False
            db.commit()
        finally:
            db.close()

        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": self.user.email, "password": "correct-password"},
        )

        self.assertEqual(response.status_code, 401)

    def test_me_without_token_returns_401(self) -> None:
        response = self.client.get("/api/v1/auth/me")

        self.assertEqual(response.status_code, 401)

    def test_me_with_invalid_token_returns_401(self) -> None:
        response = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer not-a-jwt"},
        )

        self.assertEqual(response.status_code, 401)

    def test_me_with_expired_token_returns_401(self) -> None:
        token = create_access_token(
            subject=str(self.user.id),
            expires_delta=timedelta(seconds=-1),
        )

        response = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 401)

    def test_me_rejects_user_who_no_longer_exists(self) -> None:
        token = create_access_token(subject=str(self.user.id))
        db = self.session_factory()
        try:
            user = db.get(User, self.user.id)
            db.delete(user)
            db.commit()
        finally:
            db.close()

        response = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 401)

    def test_me_rejects_user_deactivated_after_token_was_issued(self) -> None:
        token = create_access_token(subject=str(self.user.id))
        db = self.session_factory()
        try:
            user = db.get(User, self.user.id)
            user.is_active = False
            db.commit()
        finally:
            db.close()

        response = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 401)

    def test_me_with_valid_token_returns_user_without_password_hash(self) -> None:
        token = create_access_token(subject=str(self.user.id))

        response = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], self.user.id)
        self.assertEqual(response.json()["email"], self.user.email)
        self.assertNotIn("password_hash", response.json())


if __name__ == "__main__":
    unittest.main()
