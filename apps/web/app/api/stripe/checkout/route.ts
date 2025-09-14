// apps/web/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getStripe, siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json().catch(() => ({ plan: "starter" }));
  const priceId = plan === "pro" ? process.env.STRIPE_PRICE_ID_PRO : process.env.STRIPE_PRICE_ID_STARTER;
  if (!priceId) return NextResponse.json({ error: "Missing price id" }, { status: 400 });

  const stripe = getStripe();

  const customers = await stripe.customers.list({ email: session.user.email, limit: 1 });
  const customer = customers.data[0] ?? (await stripe.customers.create({ email: session.user.email }));

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl()}/account?success=1`,
    cancel_url: `${siteUrl()}/account?canceled=1`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkout.url });
}
