WinCallem Web (Next.js) — Local Setup
Requirements

Node 18+ (LTS)

npm (works fine; pnpm optional)

API running at http://localhost:8000

1) Environment

Create apps/web/.env:

# ---- URLs ----
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
API_BASE_URL=http://localhost:8000

# ---- NextAuth ----
NEXTAUTH_SECRET=REPLACE_WITH_RANDOM_64+_CHARS
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_DEBUG=true
AUTH_TRUST_HOST=true

# ---- Mail (dev) ----
EMAIL_SERVER=smtp://...mailtrap...
EMAIL_FROM=noreply@wincallem.com

# ---- DB (optional in dev) ----
DATABASE_URL=postgresql://...pooler...
DIRECT_DATABASE_URL=postgresql://...direct...

# ---- Stripe (test) ----
STRIPE_SECRET_KEY=sk_test_REPLACE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE
STRIPE_PRICE_ID_STARTER=price_REPLACE
STRIPE_PRICE_ID_PRO=price_REPLACE
STRIPE_WEBHOOK_SECRET=whsec_REPLACE

# ---- Dev login ----
DEV_PASSWORD=letmein
LOG_MAGIC_LINKS=1


NEXTAUTH_SECRET must equal the API’s AUTH_SECRET/NEXTAUTH_SECRET.

2) Install & Run
# from apps/web
npm install --force
npm run dev
# Local: http://localhost:3000


If port is busy:

npx kill-port 3000 && npm run dev

3) Auth — Credentials Provider

app/api/auth/[...nextauth]/route.ts (already committed):

JWT session

Dev password from .env

Callbacks attach plan to session.user

Sign in:

Visit http://localhost:3000/api/auth/signin → Developer Login → email(any) + DEV_PASSWORD.

Verify session:

http://localhost:3000/api/auth/session → returns { "user": ... } (200).

4) Secure Proxy → API (/api/odds/secure)

app/api/odds/secure/route.ts (already committed):

Reads decoded NextAuth token

Re-signs a short-lived HS256 JWS using NEXTAUTH_SECRET (Node crypto, no deps)

Sends Authorization: Bearer <hs256_jwt> to FastAPI /odds/secure

If you see 401 from this route:

Make sure you’re signed in (/api/auth/session returns 200)

Ensure NEXTAUTH_SECRET matches the API secret

Restart web after edits

5) Middleware (route protection)

middleware.ts protects app pages only:

export const config = { matcher: ["/dashboard/:path*", "/account/:path*", "/models/:path*"] };


Auth endpoints /api/auth/* are not matched.

6) Stripe (Week-2 scope)

/api/stripe/checkout, /api/stripe/portal, /api/stripe/webhook (runtime="nodejs", raw body in webhook)

Use STRIPE_PRICE_ID_STARTER / STRIPE_PRICE_ID_PRO

Test with stripe listen --forward-to localhost:3000/api/stripe/webhook

7) Daily Run Order

Start API (see apps/api/SETUP.md)

Start web:

cd apps/web
npx kill-port 3000
npm run dev


Sign in → test /api/odds/secure

8) Troubleshooting

/api/auth/session = 401 → not signed in, or cookies from 127.0.0.1 vs localhost. Clear cookies for both hosts and sign in again on localhost.

Invalid token alg: dir in API → you’re bypassing the proxy re-sign step. Hit the Next.js route /api/odds/secure (not the API directly) or ensure the re-sign file compiled and server restarted.

CORS errors → ensure API CORS_ORIGINS includes http://localhost:3000 and http://127.0.0.1:3000.