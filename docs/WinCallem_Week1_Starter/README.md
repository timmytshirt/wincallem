# WinCallem

**Vision:** A no-code sports betting model builder. Users can see odds, build models, run them in the background, get alerts, and export results. Affiliate “Bet” buttons link to legal sportsbooks.

## Getting Started
See `/docs/STEP_ZERO.md` for setup instructions (Windows + Mac).

## Repo Structure
- `apps/web` – Next.js frontend
- `apps/api` – FastAPI backend (Celery worker + Redis via docker-compose)
- `docs/` – Documentation and contributor setup logs

## Roadmap (MVP – ~6 weeks)
1. Setup + docs + small contributions
2. Auth (Auth.js) + Stripe subscriptions
3. Odds ingestion → DuckDB/Parquet; basic odds table
4. Model Builder v0 (configure → run Celery job → show metrics)
5. Alerts (edge > X%) + exports (CSV/Parquet)
6. Testing + polish + demo
