# WinCallem

WinCallem is a no-code sports betting model builder. This repo contains the core
app (Next.js frontend + FastAPI backend) and documentation for collaborators.

---

## For Collaborators (Non-Dev Setup)

If you’re new to coding, don’t worry — start here:

- [Step Zero Guide](docs/STEP_ZERO.md) — beginner-friendly setup guide (Windows + Mac)
- Write your notes in `docs/Setup_Log_[YourName].md`
- [Week 1 Starter Package](docs/Week1_Starter/) — onboarding PDFs and checklists
- [Vision Doc](docs/planning/Vision_Doc.docx)
- [Feature List](docs/planning/Feature_List.docx)

**Your Week 1 goal:**  
- Run the project locally (backend + frontend via Docker)  
- Confirm the dashboard works (Ping API, Fetch Odds, Run Model Job)  
- Document your setup in your Setup Log  
- Make one small contribution (doc edit or UI tweak)

---

## For Developers (Quick Start with Docker)

This repo gives you a solo-friendly foundation for a **Next.js + FastAPI + Celery** app with Redis.  
Frontend runs with `npm run dev`; backend services (API + worker + Redis) run via Docker.

### What’s inside
- **apps/web** — Next.js 14 (TypeScript) + Tailwind + shadcn-ready styling, basic pages, simple API client
- **apps/api** — FastAPI with:
  - `/health` — healthcheck
  - `/odds` — mocked odds endpoint (cached in-process)
  - `/run_model` — enqueues a Celery job
  - `/results/{task_id}` — poll job results
- **Celery worker** — background tasks (dummy model run example)
- **Redis** — broker & result backend for Celery
- **docker-compose.yml** — spins up `api`, `worker`, `redis`

> Auth, Stripe, and DuckDB are not wired here to keep the skeleton runnable. We’ll add them next.

---

## Quick Start (Local Dev with Docker)

**Prereqs:** Node.js 18+, Docker Desktop

### 1) Backend (Docker way — recommended)
From the repo root:

```bash
# Copy env file
cp apps/api/.env.example apps/api/.env   # Mac/Linux
# Windows PowerShell:
copy apps\api\.env.example apps\api\.env

# Build & run API, worker, and Redis
docker compose up --build

##Developer Setup (with Pre-Commit)

To keep code style and quality consistent across contributors, we use pre-commit hooks (Black, isort, flake8, mypy)
### 1)  Install runtime + dev dependencies
From the repo root:
pip install -r apps/api/requirements.txt -r apps/api/requirements-dev.txt

### 2)  Install pre-commit
pre-commit install
This sets up Git hooks so that checks run automatically before every commit.

### 3) Run services locally (if needed)
docker compose up

Web runs on http://localhost:3000
API runs on http://localhost:8000
Worker and Redis run in the background

### 4) Commit note
On the first commit, pre-commit may take a minute while it downloads tools.
If any checks fail, fix the issues (or let Black/isort auto-fix), then re-stage with git add . and commit again.
