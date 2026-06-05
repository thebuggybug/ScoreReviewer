from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models import User
from app.schemas import CandidateScoreCreate, InternalNotesUpdate
from app.services.candidate_service import (
    generate_candidate_summary,
    get_candidate,
    get_scores_for_stream,
    list_candidates,
    submit_candidate_score,
    update_internal_notes,
)

router = APIRouter(prefix="/candidates", tags=["candidates"])

MAX_PAGE_SIZE = 50
DEFAULT_PAGE_SIZE = 20


@router.get("")
def get_candidates(
    status: str | None = None,
    role_applied: str | None = None,
    skill: str | None = None,
    keyword: str | None = None,
    offset: int = 0,
    limit: int = DEFAULT_PAGE_SIZE,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if limit > MAX_PAGE_SIZE:
        limit = MAX_PAGE_SIZE
    if offset < 0:
        offset = 0

    return list_candidates(
        db,
        current_user,
        status=status,
        role_applied=role_applied,
        skill=skill,
        keyword=keyword,
        offset=offset,
        limit=limit,
    )


@router.get("/{candidate_id}")
def get_candidate_detail(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = get_candidate(db, candidate_id, current_user)

    if result is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return result


@router.patch("/{candidate_id}/internal-notes")
def patch_internal_notes(
    candidate_id: int,
    payload: InternalNotesUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    result = update_internal_notes(db, candidate_id, payload.internal_notes)

    if result is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return result


@router.post("/{candidate_id}/scores")
def create_candidate_score(
    candidate_id: int,
    payload: CandidateScoreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = submit_candidate_score(
        db,
        candidate_id,
        current_user,
        payload.category,
        payload.score,
        payload.note,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return result


@router.post("/{candidate_id}/summary")
def create_candidate_summary(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = generate_candidate_summary(db, candidate_id)

    if result is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return result


@router.get("/{candidate_id}/stream")
def stream_candidate_scores(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scores = get_scores_for_stream(db, candidate_id, current_user)

    if scores is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    def event_stream():
        for score in scores:
            payload = json.dumps(score)
            yield f"data: {payload}\n\n"

        done_message = json.dumps({"event": "complete", "candidate_id": candidate_id})
        yield f"data: {done_message}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
