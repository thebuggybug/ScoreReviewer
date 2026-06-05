# TechKraft — Candidate Assessment Tool

A full-stack app for TechKraft’s recruitment team to review candidates, submit category scores, and generate mock AI summaries. Built with **FastAPI** (backend) and **React + Vite** (frontend).

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

---

## Getting started (after cloning from GitHub)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (recommended), **or**
- Python 3.12+, Node.js 20+ (for local run without Docker)

### 1. Clone the repository

```bash
git clone https://github.com/thebuggybug/ScoreReviewer
cd ScoreReviewer
```

### 2. Configure environment variables

All secrets live in a `.env` file you create locally.

```bash
cp .env.example .env
```

Edit `.env` and set your values :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path. Local default: `sqlite:///./database.db`. Docker overrides via `docker-compose.yml` |
| `JWT_SECRET` | Secret for signing JWT tokens (**required**) |
| `JWT_EXPIRE_MINUTES` | Token lifetime in minutes |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin account (first startup) |
| `REVIEWER_EMAIL` / `REVIEWER_PASSWORD` | Seeded reviewer account (first startup) |



### 3. Run with Docker (recommended)

```bash
docker compose up --build
```

- **Frontend:** http://localhost:5173  
- **Backend / Swagger:** http://localhost:8000/docs  

Log in with the `ADMIN_*` or `REVIEWER_*` credentials from your `.env` file.

**Stop:**

```bash
docker compose down
```

**What Docker starts:**

| Container | Port | Role |
|-----------|------|------|
| `backend` | 8000 | FastAPI + SQLite (persisted in `backend-data` volume) |
| `frontend` | 5173 | Vite dev server; proxies `/api` → backend |

### 4. Run locally (without Docker)

**Backend** (port **8000**):

```bash
cp .env.example .env          # from project root
cd backend
python3 -m venv .fastapi
source .fastapi/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`main.py` loads `.env` from the project root via `python-dotenv`.

**Frontend** (port **5173**):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## What the app does

- **Reviewers** log in, filter candidates, submit scores (1–5 per category), trigger a mock AI summary (~2s delay).
- **Admins** see all reviewers’ scores and can view/edit internal notes.
- **Registration** always creates a `reviewer` — role is never accepted from the client.

Demo candidate data is loaded from `backend/dummyData.json` on first startup.

---

## Project structure

```
TECHKRAFT/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── dummyData.json       # seed candidates + scores
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── auth.py
│       ├── models.py
│       ├── database.py
│       ├── seed_data.py
│       ├── routers/         # auth, candidates
│       └── services/
└── frontend/
    ├── Dockerfile
    ├── vite.config.js
    └── src/
        ├── api/             # fetch client + JWT
        ├── pages/           # Login, List, Detail
        └── context/         # AuthProvider
```

---

## Architecture Decision Record (ADR)

### ADR 1 — FastAPI over Express / Django

**Decision:** Use **FastAPI** required by job description which pushed me to learn and implement

**Trade-off:** Steeper initial learning curve than staying in Node/Express

---

### ADR 2 — SQLite + separate `candidates` / `scores` tables


**Decision:** **SQLite** via SQLAlchemy with two main tables: `candidates` (profile, skills JSON, `internal_notes`, `ai_summary`) and `scores` (linked by `candidate_id` and `reviewer_id`). Indexes on `status`, `role_applied`, and `candidate_id`.

**Trade-off:** SQLite is a single file — simple to run and demo, but not best for high concurrency deployments without moving to Postgres. Seed data lives in `dummyData.json` and credentials live only in `.env`.

---

### ADR 3 — JWT auth with role-based access in the service layer


**Decision:** **JWT** (email + password login) with `Authorization: Bearer <token>`. `get_current_user` dependency on protected routes. RBAC enforced in `candidate_service.py`: filter scores by `reviewer_id`, strip `internal_notes` for non-admins. `reviewer_id` on new scores always comes from the token, never the request body.

**Trade-off:** JWTs are stateless and easy to explain in an interview, but revocation and session invalidation are harder than server-side sessions. Acceptable for this scope; production might add refresh tokens or a blocklist.

---

## Known limitations

- **Automated tests are not included** in this submission. I understand their importance but ran out of time while learning the FastAPI stack.
- **SSE `/stream`** is a basic one-shot stream, not full real-time score updates.
- **Docker frontend** runs Vite dev server, not a production nginx build.
- **AI tools** (e.g. Cursor) were used while building this project — mainly to speed up boilerplate, debug errors, and understand FastAPI patterns I hadn’t used before. I reviewed and tried to understand the code I kept.

---

## Learning reflection

I’m mainly a **frontend developer** with basic **Express** experience. **FastAPI was new to me**, but the job description asked for it, so I went for it anyway. 

I used **AI tools** to help me move faster and learn along the way not to skip understanding. Going through FastAPI was hardest parts for me.

**Tests aren’t in this repo yet** — In future learn properly pytest, API tests for login and reviewer score isolation.

If I had more time, I’d add those tests, and get deep understanding about FASTAPI

I’m eager to keep learning the backend side — this project was my first real step into that.

---

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register (always `reviewer`) |
| `POST` | `/auth/login` | Returns JWT |
| `GET` | `/candidates` | List with filters + offset pagination (default 20, max 50) |
| `GET` | `/candidates/{id}` | Detail + scores + summary |
| `POST` | `/candidates/{id}/scores` | Submit a score |
| `POST` | `/candidates/{id}/summary` | Mock AI summary (2s delay) |
| `GET` | `/candidates/{id}/stream` | SSE stream of scores (stretch goal) |

### Example API calls (curl)

Backend must be running on http://localhost:8000. Use credentials from your `.env` file.

**2. Login**

```bash
curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<useReviewerEmail>","password":"<password>"}'
```

**2. List candidates (with filters + pagination)**

```bash
curl -s "http://localhost:8000/candidates?status=new&offset=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**3. Submit a score**

```bash
curl -s -X POST http://localhost:8000/candidates/1/scores \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"Technical","score":4,"note":"Solid skills"}'
```
