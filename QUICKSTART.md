# WinCallem — Local Quickstart

This is the one-page guide for getting the full stack up on your machine.

---

## 1. API (FastAPI)

➡ [Detailed instructions](apps/api/SETUP.md)

Quick run:

```bash
cd apps/api
.\.venv\Scripts\Activate.ps1   # Windows
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
Check: http://127.0.0.1:8000/health → { "status": "ok" }

2. Web (Next.js)
➡ Detailed instructions

Quick run:

bash
Copy code
cd apps/web
npx kill-port 3000
npm install --force
npm run dev
Check: http://localhost:3000

3. Sign in (Dev Mode)
Visit: http://localhost:3000/api/auth/signin

Choose Developer Login

Email: anything

Password: from .env → DEV_PASSWORD=letmein

Verify session: http://localhost:3000/api/auth/session

4. Test Secure Route
Go to: http://localhost:3000/api/odds/secure
You should see the stub odds (200).

Notes
Web and API must share the same NEXTAUTH_SECRET.

If you change .env → restart that process (API: stop & start Uvicorn; Web: Ctrl+C then npm run dev).

CORS: API .env must include both http://localhost:3000 and http://127.0.0.1:3000.