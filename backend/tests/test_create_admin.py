import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password, verify_password
from app.db.base import Base
from app.models.user import User, UserRole
from app.schemas.user import UserRead
from scripts.create_admin import (
    DEMO_ADMIN_EMAIL,
    DEMO_ADMIN_PASSWORD,
    ensure_demo_administrator,
)


class DemoAdministratorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.session_factory = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)

    def tearDown(self) -> None:
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_creates_active_demo_administrator_with_hashed_password(self) -> None:
        with self.session_factory() as database:
            self.assertTrue(ensure_demo_administrator(database))
            user = database.query(User).filter(User.email == DEMO_ADMIN_EMAIL).one()

            self.assertEqual(user.role, UserRole.ADMIN)
            self.assertTrue(user.is_active)
            self.assertNotEqual(user.password_hash, DEMO_ADMIN_PASSWORD)
            self.assertTrue(verify_password(DEMO_ADMIN_PASSWORD, user.password_hash))
            self.assertEqual(UserRead.model_validate(user).email, DEMO_ADMIN_EMAIL)

    def test_repeated_execution_does_not_create_a_duplicate(self) -> None:
        with self.session_factory() as database:
            self.assertTrue(ensure_demo_administrator(database))
            self.assertFalse(ensure_demo_administrator(database))

            self.assertEqual(
                database.query(User).filter(User.email == DEMO_ADMIN_EMAIL).count(),
                1,
            )

    def test_existing_demo_account_is_restored_without_changing_other_users(self) -> None:
        with self.session_factory() as database:
            demo_user = User(
                email=DEMO_ADMIN_EMAIL,
                password_hash=hash_password("different-password"),
                role=UserRole.EMPLOYEE,
                is_active=False,
            )
            other_user = User(
                email="other@example.com",
                password_hash=hash_password("other-password"),
                role=UserRole.MANAGER,
                is_active=True,
            )
            database.add_all([demo_user, other_user])
            database.commit()
            other_hash = other_user.password_hash

            self.assertFalse(ensure_demo_administrator(database))

            self.assertEqual(demo_user.role, UserRole.ADMIN)
            self.assertTrue(demo_user.is_active)
            self.assertTrue(verify_password(DEMO_ADMIN_PASSWORD, demo_user.password_hash))
            self.assertEqual(other_user.role, UserRole.MANAGER)
            self.assertTrue(other_user.is_active)
            self.assertEqual(other_user.password_hash, other_hash)


if __name__ == "__main__":
    unittest.main()
