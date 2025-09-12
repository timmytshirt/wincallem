# WinCallem – Stack (Week 2 baseline, 2025-09-10)

**PM:** npm only  
**Node:** v22.16.0 (18/20 OK)

**Frontend:** Next.js 14 (App Router), Tailwind, shadcn/ui, React Query  
**Auth:** NextAuth v4 + @next-auth/prisma-adapter@1 (Mailtrap magic links) – no @auth/* v5  
**DB/ORM:** Postgres (Neon) + Prisma 6.15.0 pair (@prisma/client + prisma)  
**Payments:** Stripe (test) + Stripe CLI; Starter/Pro monthly prices  
**Env (apps/web/.env.local):**
- STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_PRICE_ID_STARTER, STRIPE_PRICE_ID_PRO
- STRIPE_WEBHOOK_SECRET
- NEXTAUTH_SECRET, NEXTAUTH_URL, EMAIL_SERVER, EMAIL_FROM, DATABASE_URL, DIRECT_DATABASE_URL

**Stripe routes:** `export const runtime = "nodejs"; export const dynamic = "force-dynamic";`  
**Webhook:** uses `await req.text()` for raw body before signature verification  
**Premium gate:** `Subscription.status` in {active, trialing}

**Backend:** FastAPI @ http://localhost:8000 with JWT HS256; Next.js secure proxy to `/odds/secure`  
**Repo layout:** app in `apps/web`; run npm commands there  
**PowerShell:** one-line commands (no `\` line breaks)
