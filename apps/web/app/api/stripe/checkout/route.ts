// apps/web/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

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

function siteUrl() {
  // Prefer public site URL; fall back to NEXTAUTH_URL; then localhost
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      priceId?: string;
      plan?: "starter" | "pro" | string;
      successUrl?: string;
      cancelUrl?: string;
    };

    const priceId = pickPriceId(body || {});
    if (!priceId) {
      return NextResponse.json({ error: "Missing or invalid priceId/plan" }, { status: 400 });
    }

    // Build URLs and include session_id so /account (or your sync) can look up the session if needed
    const success = (body?.successUrl || `${siteUrl()}/account`) + `?success=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancel = (body?.cancelUrl || `${siteUrl()}/account`) + `?canceled=1`;

    // Identify the current user (useful for tying Stripe customer to your user)
    const sessionAuth = await getServerSession(authOptions);
    const user = sessionAuth?.user as any;
    const userId = (user?.id as string | undefined) || (sessionAuth as any)?.uid;
    const email = (user?.email as string | undefined)?.toLowerCase();

    // Create (or reuse) a Checkout Session
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,

      // Signal who initiated this checkout
      client_reference_id: userId,
      customer_email: email,

      // Make the chosen plan discoverable in the webhook without extra lookups
      metadata: {
        userId: userId ?? "",
        email: email ?? "",
        plan: (body?.plan || (priceId.includes("pro") ? "pro" : "starter")) as string,
        priceId,
        from: "wincallem-web",
      },

      // Bring line_items/price (and subscription) back on the session for webhooks
      expand: ["line_items.data.price", "subscription"],

      success_url: success,
      cancel_url: cancel,
    });

    return NextResponse.json({ url: checkout.url }, { status: 200 });
  } catch (err: any) {
    console.error("checkout error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Checkout failed" }, { status: 500 });
  }
}
