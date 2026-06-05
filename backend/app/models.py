from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="reviewer")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    role_applied: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="new", index=True)
    skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    scores: Mapped[list["Score"]] = relationship("Score", back_populates="candidate")


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    reviewer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="scores")
