"""Interactively create the first administrator in an empty database."""

from getpass import getpass

from email_validator import EmailNotValidError, validate_email

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole


def main() -> None:
    raw_email = input("Administrator email: ").strip()
    try:
        email = validate_email(raw_email, check_deliverability=False).normalized
    except EmailNotValidError as error:
        raise SystemExit(f"Invalid email: {error}") from None

    password = getpass("Administrator password (minimum 8 characters): ")
    if len(password) < 8 or not password.strip():
        raise SystemExit("Password must contain at least 8 characters and cannot be blank.")

    with SessionLocal() as database:
        if database.query(User).filter(User.email == email).first() is not None:
            raise SystemExit("A user with this email already exists.")

        database.add(
            User(
                email=email,
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
                is_active=True,
            )
        )
        database.commit()

    print("Administrator created.")


if __name__ == "__main__":
    main()
