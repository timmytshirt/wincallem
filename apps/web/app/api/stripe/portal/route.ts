import { NextRequest, NextResponse } from "next/server";
import { stripe, siteUrl } from "@/app/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customers = await stripe.customers.list({ email: session.user.email, limit: 1 });
  if (!customers.data[0]) return NextResponse.json({ error: "No customer" }, { status: 400 });

  const portal = await stripe.billingPortal.sessions.create({
    customer: customers.data[0].id,
    return_url: `${siteUrl()}/account`,
  });

  return NextResponse.json({ url: portal.url });
}
