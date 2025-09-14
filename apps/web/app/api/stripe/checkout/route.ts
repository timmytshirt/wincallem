// apps/web/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getStripe, siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePriceId(raw?: string) {
  if (!raw) return "";
  const m = String(raw).match(/price_[A-Za-z0-9]+/);
  return m ? m[0] : "";
}

function pickPriceId(input: { priceId?: string; plan?: string }) {
  const fromBody = normalizePriceId(input.priceId);
  if (fromBody) return fromBody;
  if (input.plan === "starter") return normalizePriceId(process.env.STRIPE_PRICE_ID_STARTER);
  if (input.plan === "pro") return normalizePriceId(process.env.STRIPE_PRICE_ID_PRO);
  return "";
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    priceId?: string;
    plan?: "starter" | "pro" | string;
    successUrl?: string;
    cancelUrl?: string;
  };

  const priceId = pickPriceId(body || {});
  if (!priceId) return NextResponse.json({ error: "Missing or invalid priceId/plan" }, { status: 400 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).uid || (session.user as any).id;
  const email = session.user.email.toLowerCase();

  const stripe = getStripe();

  const success = (body?.successUrl || `${siteUrl()}/account`) + `?success=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancel  = (body?.cancelUrl  || `${siteUrl()}/account`) + `?canceled=1`;

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    client_reference_id: userId,
    customer_email: email,
    metadata: { userId: userId ?? "", email: email ?? "", priceId, plan: (body?.plan || (priceId.includes("pro") ? "pro" : "starter")) as string, from: "wincallem-web" },
    expand: ["line_items.data.price", "subscription"],
    success_url: success,
    cancel_url: cancel,
  });

  return NextResponse.json({ url: checkout.url }, { status: 200 });
}
