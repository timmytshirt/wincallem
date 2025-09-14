// apps/web/app/api/billing/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Prisma singleton to avoid too many connections during dev HMR */
const g = globalThis as unknown as { prisma?: PrismaClient };
const prisma = g.prisma ?? new PrismaClient();
if (!g.prisma) g.prisma = prisma;

/**
 * Purpose: ensure the logged-in user is linked to their Stripe customer.
 * We DO NOT write subscription period/status here (webhook handles that).
 */
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const userId =
    ((session?.user as any)?.id as string | undefined) ||
    ((session as any)?.uid as string | undefined);

  if (!email || !userId) {
    // Not signed in (or missing id) — nothing to do
    return new NextResponse(null, { status: 204 });
  }

  const stripe = getStripe();

  // Find or create Stripe Customer by email
  const list = await stripe.customers.list({ email, limit: 1 });
  const customer =
    list.data[0] ??
    (await stripe.customers.create({
      email,
      metadata: { userId },
    }));

  // Link customer <-> user in our DB (one row per customer)
  await prisma.subscription.upsert({
    where: { stripeCustomerId: customer.id },
    update: { userId },
    create: {
      userId,
      stripeCustomerId: customer.id,
      status: "incomplete", // webhook will update to active/trialing, etc.
    },
  });

  return NextResponse.json({ ok: true, linked: true });
}
