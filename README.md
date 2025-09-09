# WinCallem

**WinCallem** is a web-first sports betting intelligence platform:
- Odds integration (live + historical)
- No-code model builder (basic rules + backtests)
- Subscriptions via Stripe
- Simple dashboard with today’s games + best odds

## Monorepo
- `apps/web` – Next.js 14 (TS, Tailwind, shadcn/ui)
- `apps/api` – FastAPI (Python)
- `workers/` – Celery tasks
- `packages/` – shared code (types, utils)

## Quick Start

### Prereqs
- Node 20+, PNPM 9+ (or npm), Python 3.11+, Docker Desktop (optional), PostgreSQL (or Neon/Supabase)
- Stripe CLI (for webhooks in dev)

### 1) Clone & env
```bash
git clone https://github.com/<you>/wincallem.git
cd wincallem
cp .env.example .env

