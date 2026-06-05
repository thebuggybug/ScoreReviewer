from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root before any app config is read
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import SessionLocal, create_tables
from app.routers.auth import router as auth_router
from app.routers.candidates import router as candidates_router
from app.seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(candidates_router)
