// apps/web/app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Prisma singleton to avoid exhausting connections in dev */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase() ?? null;
  const userId =
    ((session?.user as any)?.id as string | undefined) ||
    ((session as any)?.uid as string | undefined) ||
    null;

  if (!email || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();

  // 1) Try to use an existing stripeCustomerId from our DB (fast path)
  let customerId: string | null = null;
  const existing = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { stripeCustomerId: true },
  });
  customerId = existing?.stripeCustomerId ?? null;

  // 2) If none, find-or-create the Stripe Customer by email and link it in DB
  if (!customerId) {
    // Try to find the customer by email in Stripe
    const list = await stripe.customers.list({ email, limit: 1 });
    let customer = list.data[0];

    if (!customer) {
      customer = await stripe.customers.create({ email, metadata: { userId } });
    } else if (!customer.metadata?.userId) {
      // Backfill a userId for easier future lookups
      await stripe.customers.update(customer.id, { metadata: { userId } }).catch(() => {});
    }

    customerId = customer.id;

    // Ensure our DB links this customer to the user
    await prisma.subscription.upsert({
      where: { stripeCustomerId: customerId },
      update: { userId },
      create: {
        userId,
        stripeCustomerId: customerId,
        status: "incomplete", // placeholder until real sub exists
      },
    });
  }

  // 3) Create the Billing Portal session
  try {
    const returnUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/account`;
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId!,
      return_url: returnUrl,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err: any) {
    console.error("portal error", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

