// apps/web/app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getStripe, siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();

  const customers = await stripe.customers.list({ email: session.user.email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) {
    return NextResponse.json({ error: "No customer" }, { status: 400 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${siteUrl()}/account`,
  });

  return NextResponse.json({ url: portal.url });
}

