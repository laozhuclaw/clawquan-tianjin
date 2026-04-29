"""
User Routes - Registration, Login, Authentication
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
import random
import re
import time
import uuid

from ..models import User
from ..database import get_db

# Config
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 7  # 7 days
PHONE_CODE_TTL_SECONDS = 5 * 60
DEMO_SMS_CODES = os.getenv("DEMO_SMS_CODES", "false").lower() == "true"

_phone_codes: dict[str, tuple[str, float]] = {}

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _user_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "phone": user.phone,
        "identity_type": "HUMAN",
        "is_human": True,
    }


def _normalize_phone(phone: str) -> str:
    normalized = re.sub(r"\D", "", phone or "")
    if len(normalized) < 6 or len(normalized) > 20:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    return normalized


def _verify_phone_code(phone: str, code: str) -> None:
    expected = _phone_codes.get(phone)
    if not expected:
        raise HTTPException(status_code=400, detail="Verification code not found or expired")
    saved_code, expires_at = expected
    if time.time() > expires_at:
        _phone_codes.pop(phone, None)
        raise HTTPException(status_code=400, detail="Verification code expired")
    if saved_code != (code or "").strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
    _phone_codes.pop(phone, None)


def _phone_email(phone: str) -> str:
    return f"{phone}@phone.clawquan.local"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/send-code")
async def send_phone_code(phone: str, purpose: str = "login"):
    normalized = _normalize_phone(phone)
    code = f"{random.randint(0, 999999):06d}"
    _phone_codes[normalized] = (code, time.time() + PHONE_CODE_TTL_SECONDS)
    response = {
        "message": "Verification code sent",
        "phone": normalized,
        "purpose": purpose,
        "expires_in": PHONE_CODE_TTL_SECONDS,
    }
    if DEMO_SMS_CODES:
        response["demo_code"] = code
    return response


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    email: str = None,
    password: str = None,
    username: str = None,
    phone: str = None,
    code: str = None,
    db: Session = Depends(get_db),
):
    if phone:
        normalized_phone = _normalize_phone(phone)
        _verify_phone_code(normalized_phone, code or "")
        email = email or _phone_email(normalized_phone)
        password = password or uuid.uuid4().hex
    else:
        normalized_phone = None
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email/password or phone/code is required")

    duplicate_filters = [User.email == email]
    if username:
        duplicate_filters.append(User.username == username)
    if normalized_phone:
        duplicate_filters.append(User.phone == normalized_phone)
    existing_user = db.query(User).filter(or_(*duplicate_filters)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email, phone, or username already registered"
        )

    # Create new user
    hashed_password = get_password_hash(password)
    new_user = User(
        email=email,
        username=username,
        password_hash=hashed_password,
        phone=normalized_phone,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    response = {
        "message": "User registered successfully",
        "user": _user_to_dict(new_user)
    }
    if normalized_phone:
        response["access_token"] = create_access_token(data={"sub": new_user.email})
        response["token_type"] = "bearer"
    return response

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _user_to_dict(user)
    }


@router.post("/login-code")
async def login_with_phone_code(phone: str, code: str, db: Session = Depends(get_db)):
    normalized_phone = _normalize_phone(phone)
    _verify_phone_code(normalized_phone, code)
    user = db.query(User).filter(User.phone == normalized_phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="Phone number is not registered")

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _user_to_dict(user),
    }

@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user)):
    return _user_to_dict(current_user)
