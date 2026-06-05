from __future__ import annotations

import time
from typing import Any

from sqlalchemy import String, cast
from sqlalchemy.orm import Session

from app.auth import is_admin
from app.models import Candidate, Score, User


def _candidate_to_dict(candidate: Candidate, include_internal_notes: bool) -> dict[str, Any]:
    data = {
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "role_applied": candidate.role_applied,
        "status": candidate.status,
        "skills": candidate.skills,
        "created_at": candidate.created_at.isoformat(),
    }

    if include_internal_notes:
        data["internal_notes"] = candidate.internal_notes

    return data


def _score_to_dict(score: Score) -> dict[str, Any]:
    return {
        "id": score.id,
        "candidate_id": score.candidate_id,
        "category": score.category,
        "score": score.score,
        "reviewer_id": score.reviewer_id,
        "note": score.note,
        "created_at": score.created_at.isoformat(),
    }


def list_candidates(
    db: Session,
    current_user: User,
    status: str | None = None,
    role_applied: str | None = None,
    skill: str | None = None,
    keyword: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> dict[str, Any]:
    include_internal_notes = is_admin(current_user)

    query = db.query(Candidate)

    if status is not None:
        query = query.filter(Candidate.status == status)

    if role_applied is not None:
        query = query.filter(Candidate.role_applied == role_applied)

    if skill is not None:
        skill_pattern = f'%"{skill}"%'
        query = query.filter(cast(Candidate.skills, String).like(skill_pattern))

    if keyword is not None:
        pattern = f"%{keyword}%"
        query = query.filter(
            (Candidate.name.ilike(pattern)) | (Candidate.email.ilike(pattern))
        )

    total = query.count()

    candidates = (
        query.order_by(Candidate.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for candidate in candidates:
        items.append(_candidate_to_dict(candidate, include_internal_notes))

    return {
        "items": items,
        "total": total,
        "offset": offset,
        "limit": limit,
    }


def get_candidate(
    db: Session,
    candidate_id: int,
    current_user: User,
) -> dict[str, Any] | None:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()

    if candidate is None:
        return None

    scores_query = db.query(Score).filter(Score.candidate_id == candidate_id)

    # Reviewers only see scores they submitted
    if not is_admin(current_user):
        scores_query = scores_query.filter(Score.reviewer_id == current_user.id)

    scores = scores_query.order_by(Score.created_at.desc()).all()

    score_items = []
    for score in scores:
        score_items.append(_score_to_dict(score))

    include_internal_notes = is_admin(current_user)
    result = _candidate_to_dict(candidate, include_internal_notes)
    result["scores"] = score_items
    result["summary"] = candidate.ai_summary

    return result


def update_internal_notes(
    db: Session,
    candidate_id: int,
    internal_notes: str,
) -> dict[str, Any] | None:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()

    if candidate is None:
        return None

    candidate.internal_notes = internal_notes
    db.commit()
    db.refresh(candidate)

    return _candidate_to_dict(candidate, include_internal_notes=True)


def submit_candidate_score(
    db: Session,
    candidate_id: int,
    current_user: User,
    category: str,
    score: int,
    note: str | None = None,
) -> dict[str, Any] | None:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if candidate is None:
        return None

    # reviewer_id comes from the logged-in user — never from the request body
    new_score = Score(
        candidate_id=candidate_id,
        category=category,
        score=score,
        reviewer_id=current_user.id,
        note=note,
    )

    db.add(new_score)
    db.commit()
    db.refresh(new_score)

    return _score_to_dict(new_score)


def generate_candidate_summary(
    db: Session,
    candidate_id: int,
) -> dict[str, Any] | None:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if candidate is None:
        return None

    # Simulates a slow LLM API call (2 seconds)
    time.sleep(2)

    skills_text = ", ".join(candidate.skills)
    summary_text = (
        f"Mock AI summary for {candidate.name} ({candidate.role_applied}): "
        f"Status is {candidate.status}. Key skills: {skills_text}. "
        f"Review scores on file before making a hiring decision."
    )

    candidate.ai_summary = summary_text
    db.commit()
    db.refresh(candidate)

    return {
        "candidate_id": candidate_id,
        "summary": summary_text,
    }


def get_scores_for_stream(
    db: Session,
    candidate_id: int,
    current_user: User,
) -> list[dict[str, Any]] | None:
    """Load scores for SSE. Returns None if candidate does not exist."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if candidate is None:
        return None

    scores_query = db.query(Score).filter(Score.candidate_id == candidate_id)

    if not is_admin(current_user):
        scores_query = scores_query.filter(Score.reviewer_id == current_user.id)

    scores = scores_query.order_by(Score.created_at.asc()).all()

    result = []
    for score in scores:
        result.append(_score_to_dict(score))

    return result
