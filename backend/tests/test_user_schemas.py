import unittest

from pydantic import ValidationError

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRead


class UserCreateSchemaTests(unittest.TestCase):
    def test_valid_input_defaults_to_employee_role(self) -> None:
        user = UserCreate(email="person@example.com", password="secure-password")

        self.assertEqual(user.email, "person@example.com")
        self.assertEqual(user.role, UserRole.EMPLOYEE)

    def test_invalid_email_is_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            UserCreate(email="not-an-email", password="secure-password")

    def test_password_shorter_than_eight_characters_is_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            UserCreate(email="person@example.com", password="short")


class UserReadSchemaTests(unittest.TestCase):
    def test_serializes_orm_model_without_password_hash(self) -> None:
        user = User(
            id=1,
            email="person@example.com",
            password_hash="sensitive-hash",
            role=UserRole.MANAGER,
            is_active=True,
        )

        response = UserRead.model_validate(user)
        response_data = response.model_dump()

        self.assertEqual(response_data["role"], UserRole.MANAGER)
        self.assertNotIn("password_hash", response_data)


if __name__ == "__main__":
    unittest.main()
