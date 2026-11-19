import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.models.user import User

def test_password_hashing():
    raw = "MySecurePassword123"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_cycle():
    user_id = "user-uuid-12345"
    token = create_access_token(subject=user_id)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == user_id

def test_user_schema_validation():
    user_in = UserCreate(
        email="developer@example.com",
        password="ValidPassword123!",
        full_name="Jane Doe"
    )
    assert user_in.email == "developer@example.com"
    assert user_in.full_name == "Jane Doe"

def test_user_login_schema():
    login_in = UserLogin(
        email="developer@example.com",
        password="ValidPassword123!"
    )
    assert login_in.email == "developer@example.com"

def test_user_database_lifecycle(db_session):
    test_email = "db_test_candidate@domain.com"
    existing = db_session.query(User).filter(User.email == test_email).first()
    if existing:
        db_session.delete(existing)
        db_session.commit()

    user = User(
        email=test_email,
        hashed_password=get_password_hash("SecretPassword123!"),
        full_name="Robert Smith",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.email == test_email
    assert verify_password("SecretPassword123!", user.hashed_password) is True
    assert verify_password("BadPassword", user.hashed_password) is False

    # Clean up
    db_session.delete(user)
    db_session.commit()
