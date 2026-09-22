import unittest

from app.core.security import hash_password, verify_password


class PasswordSecurityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.password = "correct horse battery staple"
        self.hashed_password = hash_password(self.password)

    def test_hash_password_does_not_return_plaintext(self) -> None:
        self.assertNotEqual(self.hashed_password, self.password)

    def test_correct_password_verifies(self) -> None:
        self.assertTrue(verify_password(self.password, self.hashed_password))

    def test_incorrect_password_does_not_verify(self) -> None:
        self.assertFalse(verify_password("incorrect password", self.hashed_password))


if __name__ == "__main__":
    unittest.main()
