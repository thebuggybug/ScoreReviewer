from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, get_user_by_email, hash_password, verify_password
from app.database import get_db
from app.models import User
from app.schemas import TokenResponse, UserLogin, UserRegister, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, payload.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hardcoded role — never trust the client (PDF requirement)
    new_user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="reviewer",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    password_ok = verify_password(payload.password, user.hashed_password)
    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user)

    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
