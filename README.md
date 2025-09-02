# WinCallem

WinCallem is a no-code sports betting model builder. This repo contains the core
app (Next.js frontend + FastAPI backend) and documentation for collaborators.

## What’s inside
- **apps/web** — Next.js 14 (TypeScript) + Tailwind + shadcn-ready styling, basic pages, simple API client.
- **apps/api** — FastAPI with:
  - `/health` — healthcheck
  - `/odds` — mocked odds endpoint (cached in-process)
  - `/run_model` — enqueues a Celery job
  - `/results/{task_id}` — poll job results
- **Celery worker** — background tasks (dummy model run example).
- **Redis** — broker & result backend for Celery.
- **docker-compose.yml** — spins up `api`, `worker`, `redis` (frontend runs with `npm run dev`).

> Auth, Stripe, and DuckDB are not wired here to keep the skeleton runnable. We’ll add them next.

---

## For Collaborators (Non-Dev Setup)
If you’re new to coding, don’t worry — start here:  
- Go to [`docs/STEP_ZERO.md`](docs/STEP_ZERO.md) → beginner-friendly setup guide  
- Write your notes in `docs/Setup_Log_[YourName].md`  
- See `docs/Week1_Starter/` → onboarding PDFs and checklists


## Quick start (local dev)

**Prereqs:** Node 18+, Python 3.11+, Docker (for Redis + API/worker via compose or use local Python).

### 1) Backend (Docker way — recommended)
```bash
# From the repo root
cp apps/api/.env.example apps/api/.env

# Build & run API, worker, and Redis
docker compose up --build
# API: http://localhost:8000/docs
# Redis: redis://localhost:6379
```

### 1b) Backend (Local Python way — if you don’t want Docker)
```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate  # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt

# start Redis separately (Docker easiest)
# docker run -p 6379:6379 redis:7-alpine

# start API
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# in a new terminal (same venv), start the worker
celery -A celery_app.celery worker --loglevel=INFO
```

### 2) Frontend (Next.js)
```bash
cd apps/web
npm install
# set your API base in .env.local if needed
cp .env.example .env.local
npm run dev
# open http://localhost:3000
```

### 3) Kick the tires
- Open **http://localhost:3000** (Next.js).
- Click **“Ping API”** to hit `/health`.
- Click **“Fetch Odds”** to hit `/odds` (mocked).
- Click **“Run Model Job”** to enqueue a Celery task, then **“Check Result”**.

---

## Environment variables

### apps/api/.env
```
API_HOST=0.0.0.0
API_PORT=8000
REDIS_URL=redis://redis:6379/0
CORS_ORIGINS=http://localhost:3000
```

> If you run the API locally without Docker, set `REDIS_URL=redis://localhost:6379/0`.

### apps/web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Planning Docs
## Documentation
- [Step Zero Guide](docs/STEP_ZERO.md)
- [Week 1 Starter Package](docs/Week1_Starter/)
- [Vision Doc](docs/planning/Vision_Doc.docx)
- [Feature List](docs/planning/Feature_List.docx)



## Next steps (after you confirm this runs)
1. **Auth (Auth.js/NextAuth)** — wire email magic links or OAuth and send JWT to FastAPI for verification.
2. **Stripe** — subscriptions + webhooks.
3. **Data** — add DuckDB ingest + Parquet in S3/R2.
4. **Scheduling** — Celery Beat or Prefect for periodic odds pulls + alerts.
5. **Refine UI** — shadcn components, dashboard, model builder wizard.
