"""Create an administrator interactively or ensure the local demo account exists."""

import argparse
from getpass import getpass

from email_validator import EmailNotValidError, validate_email
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole

DEMO_ADMIN_EMAIL = "demo@corporation.local"
DEMO_ADMIN_PASSWORD = "Demo123!"


def create_administrator(database: Session, email: str, password: str) -> bool:
    if database.query(User).filter(User.email == email).first() is not None:
        return False

    database.add(
        User(
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )
    )
    database.commit()
    return True


def ensure_demo_administrator(database: Session) -> bool:
    user = database.query(User).filter(User.email == DEMO_ADMIN_EMAIL).first()
    if user is None:
        return create_administrator(database, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)

    changed = False
    if user.role != UserRole.ADMIN:
        user.role = UserRole.ADMIN
        changed = True
    if not user.is_active:
        user.is_active = True
        changed = True
    if not verify_password(DEMO_ADMIN_PASSWORD, user.password_hash):
        user.password_hash = hash_password(DEMO_ADMIN_PASSWORD)
        changed = True

    if changed:
        database.commit()
    return False


def create_demo_administrator() -> None:
    with SessionLocal() as database:
        created = ensure_demo_administrator(database)

    if created:
        print("Demo administrator created.")
    else:
        print("Demo administrator already existed; demo access is ready.")


def create_interactive_administrator() -> None:
    raw_email = input("Administrator email: ").strip()
    try:
        email = validate_email(raw_email, check_deliverability=False).normalized
    except EmailNotValidError as error:
        raise SystemExit(f"Invalid email: {error}") from None

    password = getpass("Administrator password (minimum 8 characters): ")
    if len(password) < 8 or not password.strip():
        raise SystemExit("Password must contain at least 8 characters and cannot be blank.")

    with SessionLocal() as database:
        if not create_administrator(database, email, password):
            raise SystemExit("A user with this email already exists.")

    print("Administrator created.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Ensure the public local demo administrator exists.",
    )
    arguments = parser.parse_args()

    if arguments.demo:
        create_demo_administrator()
    else:
        create_interactive_administrator()


if __name__ == "__main__":
    main()
