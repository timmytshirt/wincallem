WinCallem API (FastAPI) — Local Setup
Requirements

Python 3.11+

Uvicorn

(Optional) Redis for workers later

1) Environment

Create apps/api/.env:

API_HOST=0.0.0.0
API_PORT=8000

# If not using docker, local redis is fine later
REDIS_URL=redis://localhost:6379/0

# CORS must include both hosts
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Auth secret must match web NEXTAUTH_SECRET
AUTH_SECRET=REPLACE_WITH_SAME_VALUE_AS_WEB
NEXTAUTH_SECRET=REPLACE_WITH_SAME_VALUE_AS_WEB


The secret in web and API must be identical.

2) Install
# from apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt

3) Run
# from apps/api
.\.venv\Scripts\Activate.ps1
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000


Health check: http://127.0.0.1:8000/health → { "status": "ok" }

When you change .env: stop Uvicorn (Ctrl+C) and start it again. --reload won’t reload env vars.

4) Auth (verify_jwt)

app.py:

Reads AUTH_SECRET (or NEXTAUTH_SECRET)

Accepts HS256/384/512

Rejects JWE (alg:"dir") — we don’t need to support it, because the web proxy re-signs to HS256

Protected endpoints:

GET /protected

GET /odds/secure (returns stub odds)

5) Odds stub

GET /odds → public

GET /odds/secure → protected (uses verify_jwt)

6) Typical Failure → Fix

401 Missing Bearer token → Next.js proxy didn’t send Authorization. Use the /api/odds/secure proxy route, not the API directly, or ensure proxy code forwards the header.

Invalid token alg: dir → The client sent an encrypted JWE. Use the Next.js proxy that re-signs to HS256.

AUTH_SECRET not set → .env not loaded; confirm it exists in apps/api/.env and restart Uvicorn.

CORS → Add both http://localhost:3000 and http://127.0.0.1:3000 to CORS_ORIGINS, restart.

7) Run Order (with web)

Start API (above)

Start web (apps/web, npm run dev)

Sign in at web /api/auth/signin

Hit web /api/odds/secure (proxies to API /odds/secure with HS256 JWT)