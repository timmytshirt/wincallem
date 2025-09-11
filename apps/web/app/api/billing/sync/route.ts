import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { stripe, siteUrl } from "@/lib/stripe";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const uid = (session as any)?.uid as string | undefined;
  if (!email || !uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customers = await stripe.customers.list({ email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) return NextResponse.json({ ok: true, linked: false }); // nothing to link yet

  await prisma.subscription.upsert({
    where: { stripeCustomerId: customer.id },
    update: { userId: uid },
    create: {
      userId: uid,
      stripeCustomerId: customer.id,
      status: "incomplete", // webhook will update to active/trialing shortly
    },
  });

  return NextResponse.json({ ok: true, linked: true });
}
