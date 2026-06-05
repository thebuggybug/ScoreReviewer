import json
import os
from pathlib import Path

from sqlalchemy.orm import Session

from app.auth import get_user_by_email, hash_password
from app.models import Candidate, Score, User

DUMMY_DATA_FILE = Path(__file__).resolve().parent.parent / "dummyData.json"


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(
            f"Missing {name}. Copy .env.example to .env and set the value."
        )
    return value


def load_dummy_data() -> dict:
    with open(DUMMY_DATA_FILE, encoding="utf-8") as file:
        return json.load(file)


def seed_users(db: Session) -> None:
    """Demo accounts come only from .env — never hardcoded in code."""
    demo_users = [
        {
            "email": _require_env("ADMIN_EMAIL"),
            "password": _require_env("ADMIN_PASSWORD"),
            "role": "admin",
        },
        {
            "email": _require_env("REVIEWER_EMAIL"),
            "password": _require_env("REVIEWER_PASSWORD"),
            "role": "reviewer",
        },
    ]

    for user_data in demo_users:
        existing = get_user_by_email(db, user_data["email"])
        if existing is not None:
            continue

        new_user = User(
            email=user_data["email"],
            hashed_password=hash_password(user_data["password"]),
            role=user_data["role"],
        )
        db.add(new_user)

    db.commit()


def seed_candidates_and_scores(db: Session) -> None:
    existing_count = db.query(Candidate).count()
    if existing_count > 0:
        return

    data = load_dummy_data()

    reviewer_email = _require_env("REVIEWER_EMAIL")
    reviewer = get_user_by_email(db, reviewer_email)
    if reviewer is None:
        return

    for candidate_data in data["candidates"]:
        candidate = Candidate(
            name=candidate_data["name"],
            email=candidate_data["email"],
            role_applied=candidate_data["role_applied"],
            status=candidate_data["status"],
            skills=candidate_data["skills"],
            internal_notes=candidate_data.get("internal_notes"),
            ai_summary=candidate_data.get("ai_summary"),
        )
        db.add(candidate)
        db.flush()

        for score_data in candidate_data.get("scores", []):
            score = Score(
                candidate_id=candidate.id,
                category=score_data["category"],
                score=score_data["score"],
                reviewer_id=reviewer.id,
                note=score_data.get("note"),
            )
            db.add(score)

    db.commit()


def seed_database(db: Session) -> None:
    seed_users(db)
    seed_candidates_and_scores(db)
