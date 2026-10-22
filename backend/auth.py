import re
import os
import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from typing import Optional

import jwt
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models import User

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-icc-tri-series-key-2026-pak-eng-sl")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@tri-series-fantasy.pk")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)
router = APIRouter(prefix="/auth", tags=["Authentication"])

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

# Schemas
class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    fantasy_team_name: Optional[str] = None
    avatar_url: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    token: str
    new_password: str

class OnboardingRequest(BaseModel):
    full_name: str
    fantasy_team_name: str
    avatar_url: Optional[str] = None

class AvatarUpdateRequest(BaseModel):
    avatar_url: str

class SocialLoginRequest(BaseModel):
    provider: str  # "google" or "facebook"
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None

# Helpers
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None
    return None

def send_smtp_email(to_email: str, subject: str, content: str):
    if not SMTP_HOST:
        print(f"[SMTP DEV FALLBACK] To: {to_email} | Subject: {subject}\n{content}")
        return False
    try:
        msg = MIMEText(content, "html")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = to_email

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=5) as server:
            server.starttls()
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send email: {e}")
        return False

# Endpoints
@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    if not re.match(EMAIL_REGEX, req.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    existing = db.query(User).filter(User.email.ilike(req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if req.fantasy_team_name:
        team_existing = db.query(User).filter(User.fantasy_team_name.ilike(req.fantasy_team_name)).first()
        if team_existing:
            raise HTTPException(status_code=400, detail="Fantasy team name is already taken")

    new_user = User(
        email=req.email.lower().strip(),
        hashed_password=hash_password(req.password),
        full_name=req.full_name.strip() if req.full_name else None,
        fantasy_team_name=req.fantasy_team_name.strip() if req.fantasy_team_name else None,
        avatar_url=req.avatar_url if req.avatar_url else None,
        is_admin=False,
        is_verified=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    needs_onboarding = not bool(new_user.full_name and new_user.fantasy_team_name)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "fantasy_team_name": new_user.fantasy_team_name,
            "avatar_url": new_user.avatar_url,
            "is_admin": new_user.is_admin,
            "is_verified": bool(new_user.is_verified),
            "onboarding_required": needs_onboarding,
        }
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(req.email.strip())).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    needs_onboarding = not bool(user.full_name and user.fantasy_team_name)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "fantasy_team_name": user.fantasy_team_name,
            "avatar_url": user.avatar_url,
            "is_admin": user.is_admin,
            "is_verified": bool(user.is_verified),
            "onboarding_required": needs_onboarding,
        }
    }

@router.post("/google")
def google_social_login(req: SocialLoginRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip() if req.email else f"google_user_{secrets.token_hex(4)}@gmail.com"
    avatar = req.avatar_url or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user:
        user = User(
            email=email,
            full_name=req.name or "Google Fan",
            oauth_provider="google",
            oauth_id=secrets.token_hex(8),
            avatar_url=avatar,
            is_admin=False,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.is_verified = True
        if not user.avatar_url:
            user.avatar_url = avatar
        db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    needs_onboarding = not bool(user.full_name and user.fantasy_team_name)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "fantasy_team_name": user.fantasy_team_name,
            "avatar_url": user.avatar_url,
            "is_admin": user.is_admin,
            "is_verified": bool(user.is_verified),
            "onboarding_required": needs_onboarding,
        }
    }

@router.post("/facebook")
def facebook_social_login(req: SocialLoginRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip() if req.email else f"facebook_fan_{secrets.token_hex(4)}@facebook.com"
    avatar = req.avatar_url or "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80"
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user:
        user = User(
            email=email,
            full_name=req.name or "Cricket Supporter",
            oauth_provider="facebook",
            oauth_id=secrets.token_hex(8),
            avatar_url=avatar,
            is_admin=False,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.is_verified = True
        if not user.avatar_url:
            user.avatar_url = avatar
        db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    needs_onboarding = not bool(user.full_name and user.fantasy_team_name)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "fantasy_team_name": user.fantasy_team_name,
            "avatar_url": user.avatar_url,
            "is_admin": user.is_admin,
            "is_verified": bool(user.is_verified),
            "onboarding_required": needs_onboarding,
        }
    }

@router.post("/onboarding")
def complete_onboarding(req: OnboardingRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    full_name = req.full_name.strip()
    team_name = req.fantasy_team_name.strip()
    if not full_name:
        raise HTTPException(status_code=400, detail="Full name cannot be empty")
    if len(team_name) < 3:
        raise HTTPException(status_code=400, detail="Fantasy team name must be at least 3 characters")

    # Check uniqueness of team name for other users
    existing = db.query(User).filter(User.fantasy_team_name.ilike(team_name), User.id != current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Team name '{team_name}' is already taken. Please pick another.")

    current_user.full_name = full_name
    current_user.fantasy_team_name = team_name
    if req.avatar_url:
        current_user.avatar_url = req.avatar_url
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Onboarding completed successfully!",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "fantasy_team_name": current_user.fantasy_team_name,
            "avatar_url": current_user.avatar_url,
            "is_admin": current_user.is_admin,
            "is_verified": bool(current_user.is_verified),
            "onboarding_required": False,
        }
    }

@router.post("/avatar")
def update_avatar(req: AvatarUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.avatar_url = req.avatar_url
    db.commit()
    db.refresh(current_user)
    return {
        "message": "Profile picture updated successfully!",
        "avatar_url": current_user.avatar_url,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "fantasy_team_name": current_user.fantasy_team_name,
            "avatar_url": current_user.avatar_url,
            "is_admin": current_user.is_admin,
            "is_verified": bool(current_user.is_verified),
            "onboarding_required": False,
        }
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(req.email.strip())).first()
    if not user:
        # Avoid user enumeration for security, but return message
        return {
            "message": "If this email is registered, a password reset token has been sent.",
            "dev_reset_token": None
        }

    # Generate 6-digit OTP / secure token
    token = secrets.token_hex(16)
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    email_body = f"""
    <h2>2026 Pakistan ODI Tri-Series Daily Fantasy</h2>
    <p>Hello {user.full_name or 'Cricket Fan'},</p>
    <p>You requested a password reset for your fantasy account.</p>
    <p>Your secure reset token is:</p>
    <h3 style="background:#064e3b; color:#fbbf24; padding:10px 15px; display:inline-block; border-radius:6px;">{token}</h3>
    <p>This token expires in 15 minutes.</p>
    """
    send_smtp_email(user.email, "Password Reset - 2026 ODI Tri-Series Fantasy", email_body)

    return {
        "message": "Password reset instructions and token have been sent to your email.",
        "dev_reset_token": token,  # Included for local testing and developer preview!
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    user = db.query(User).filter(
        User.email.ilike(req.email.strip()),
        User.reset_token == req.token.strip()
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token or email")
    
    if not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()

    return {"message": "Password has been reset successfully! You can now log in."}

@router.post("/verify-email")
def verify_email(email: str, current_user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    target_user = current_user
    if not target_user and email:
        target_user = db.query(User).filter(User.email.ilike(email.strip())).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    target_user.is_verified = True
    db.commit()
    return {"message": f"Email {target_user.email} verified successfully!", "is_verified": True}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    needs_onboarding = not bool(current_user.full_name and current_user.fantasy_team_name)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "fantasy_team_name": current_user.fantasy_team_name,
        "avatar_url": current_user.avatar_url,
        "is_admin": current_user.is_admin,
        "is_verified": bool(current_user.is_verified),
        "onboarding_required": needs_onboarding,
    }
