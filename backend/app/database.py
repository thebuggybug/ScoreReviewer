import os
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_FILE = BACKEND_DIR / "database.db"


def _default_database_url() -> str:
    return f"sqlite:///{DEFAULT_DB_FILE.as_posix()}"


def _resolve_database_url() -> str:
    """
    Use DATABASE_URL from .env when set.
    If it points to Docker's /app/data but we're running locally, fall back
    to backend/database.db so the same .env works in both environments.
    """
    env_url = os.getenv("DATABASE_URL")
    if not env_url:
        return _default_database_url()

    if env_url.startswith("sqlite:////app/"):
        docker_data_dir = Path("/app/data")
        if not docker_data_dir.exists():
            return _default_database_url()

    return env_url


DATABASE_URL = _resolve_database_url()

_engine_kwargs: dict = {
    "connect_args": {"check_same_thread": False},
}

if ":memory:" in DATABASE_URL:
    _engine_kwargs["poolclass"] = StaticPool

engine = create_engine(DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    from app import models  # noqa: F401

    db_file = DEFAULT_DB_FILE
    if DATABASE_URL.startswith("sqlite:///"):
        path_str = DATABASE_URL.replace("sqlite:///", "", 1)
        if path_str and path_str != ":memory:":
            db_file = Path(path_str)
            db_file.parent.mkdir(parents=True, exist_ok=True)

    Base.metadata.create_all(bind=engine)
