// apps/web/app/api/billing/sync/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";
import { getStripe } from "@/lib/stripe";   // ✅ lazy init

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const uid = (session as any)?.uid as string | undefined;

  if (!email || !uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe(); // ✅ init at runtime

  const customers = await stripe.customers.list({ email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) {
    return NextResponse.json({ ok: true, linked: false });
  }

  await prisma.subscription.upsert({
    where: { stripeCustomerId: customer.id },
    update: { userId: uid },
    create: {
      userId: uid,
      stripeCustomerId: customer.id,
      status: "incomplete",
    },
  });

  return NextResponse.json({ ok: true, linked: true });
}
