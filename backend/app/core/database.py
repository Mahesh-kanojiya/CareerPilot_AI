import os
import json
from typing import Generator, Any
from sqlalchemy import create_engine, event, text, TypeDecorator, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# Determine DB dialect
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Handle pgvector Vector type with graceful SQLite fallback
if not is_sqlite:
    try:
        from pgvector.sqlalchemy import Vector as PgVector
        VectorType = PgVector(settings.VECTOR_DIMENSION)
    except ImportError:
        # Fallback if pgvector package isn't present
        class VectorType(TypeDecorator):
            impl = Text
            cache_ok = True
            def process_bind_param(self, value, dialect):
                return json.dumps(value) if value is not None else None
            def process_result_value(self, value, dialect):
                return json.loads(value) if value is not None else None
else:
    # Custom SQLite vector storage (stored as JSON array string)
    class VectorType(TypeDecorator):
        impl = Text
        cache_ok = True
        def process_bind_param(self, value, dialect):
            if value is None:
                return None
            if isinstance(value, list):
                return json.dumps(value)
            return value
        def process_result_value(self, value, dialect):
            if value is None:
                return None
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except Exception:
                    return []
            return value

# Engine configuration
connect_args = {"check_same_thread": False} if is_sqlite else {}
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False
)

# Automatically create pgvector extension if connected to PostgreSQL
if not is_sqlite:
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
    except Exception as e:
        print(f"[Warning] Could not initialize pgvector extension: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
