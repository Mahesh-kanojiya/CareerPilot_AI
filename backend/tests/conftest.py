import os
import sys
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.models  # Register all models
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure test environment
os.environ["ENVIRONMENT"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///./test_careerpilot.db"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_purposes_only_12345"

from app.core.config import settings
settings.ENVIRONMENT = "testing"

from app.core.database import Base, get_db
from app.main import app
from app.core.security import get_password_hash
from app.models.user import User
from app.models.job import Job
from app.models.resume import Resume
from app.services.embedding_service import embedding_service

TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test_careerpilot.db"
test_engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_careerpilot.db"):
        try:
            os.remove("./test_careerpilot.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    # Avoid running default lifespan against production DB during unit tests
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session):
    user = db_session.query(User).filter(User.email == "testcandidate@example.com").first()
    if not user:
        user = User(
            email="testcandidate@example.com",
            hashed_password=get_password_hash("ValidPass123!"),
            full_name="Alex Mercer",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(client, test_user):
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "testcandidate@example.com",
        "password": "ValidPass123!"
    })
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
