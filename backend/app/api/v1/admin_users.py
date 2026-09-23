from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserPasswordUpdate, UserRead, UserUpdate


router = APIRouter(prefix="/admin/users", tags=["admin-users"])
admin_only = require_roles(UserRole.ADMIN)


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


def commit_user(db: Session, user: User) -> User:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        ) from None
    db.refresh(user)
    return user


@router.get("", response_model=list[UserRead])
def list_users(
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(admin_only)],
) -> list[User]:
    return db.query(User).order_by(User.id).all()


@router.get("/{user_id}", response_model=UserRead)
def read_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(admin_only)],
) -> User:
    return get_user_or_404(db, user_id)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(admin_only)],
) -> User:
    user = User(
        email=str(user_data.email),
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        is_active=user_data.is_active,
    )
    db.add(user)
    return commit_user(db, user)


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(admin_only)],
) -> User:
    user = get_user_or_404(db, user_id)
    update_data = user_data.model_dump(exclude_unset=True)

    if user.id == current_admin.id:
        if update_data.get("is_active") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot deactivate their own account",
            )
        if "role" in update_data and update_data["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot remove their own ADMIN role",
            )

    for field, value in update_data.items():
        setattr(user, field, value)
    return commit_user(db, user)


@router.put("/{user_id}/password", response_model=UserRead)
def set_user_password(
    user_id: int,
    password_data: UserPasswordUpdate,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(admin_only)],
) -> User:
    user = get_user_or_404(db, user_id)
    user.password_hash = hash_password(password_data.password)
    return commit_user(db, user)
