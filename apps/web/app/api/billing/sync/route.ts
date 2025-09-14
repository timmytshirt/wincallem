// apps/web/app/api/billing/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Simple Prisma singleton to avoid too many connections on dev HMR */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

// Map Stripe price IDs → your plan slugs for nicer UI
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_ID_STARTER ?? ""]: "starter",
  [process.env.STRIPE_PRICE_ID_PRO ?? ""]: "pro",
};

export async function POST(req: NextRequest) {
  // Optional: enforce POST (Next already routes here only on POST, but it's nice to be explicit)
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase() ?? null;
  // Prefer NextAuth's user.id; fall back to your custom uid if present
  const userId =
    ((session?.user as any)?.id as string | undefined) ||
    ((session as any)?.uid as string | undefined) ||
    null;

  if (!email || !userId) {
    // Not signed in (or missing id) — nothing to sync
    return new NextResponse(null, { status: 204 });
  }

  const stripe = getStripe();

  // 1) Find or create the Stripe Customer for this user/email
  let customerId: string | null = null;
  try {
    const found = await stripe.customers.list({ email, limit: 1 });
    let customer = found.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
    } else if (!customer.metadata?.userId) {
      // Backfill metadata for easier linkage later
      await stripe.customers.update(customer.id, { metadata: { userId } }).catch(() => {});
    }
    customerId = customer.id;
  } catch (err) {
    console.error("sync: customer error", err);
    return NextResponse.json({ error: "Stripe customer lookup failed" }, { status: 500 });
  }

  // Ensure we at least link the customer to this user in our DB
  await prisma.subscription.upsert({
    where: { stripeCustomerId: customerId },
    update: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      status: "incomplete", // placeholder until we see a real subscription
    },
  });

  // 2) Pull the most recent subscription for this customer (any status)
  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.items.data.price"],
      limit: 1,
    });

    const sub = subs.data[0];
    if (!sub) {
      // No subscription yet — linkage above is sufficient
      return new NextResponse(null, { status: 204 });
    }

    const priceId = sub.items.data[0]?.price?.id ?? null;
    const plan = priceId ? PRICE_TO_PLAN[priceId] ?? null : null;

    // 3) Upsert full subscription details (one row per customer)
    await prisma.subscription.upsert({
      where: { stripeCustomerId: customerId },
      update: {
        userId,
        stripeSubscriptionId: sub.id,
        priceId: priceId ?? undefined,
        plan,
        status: sub.status, // 'trialing' | 'active' | 'past_due' | 'canceled' | ...
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
        cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      },
      create: {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        priceId: priceId ?? undefined,
        plan,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
        cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("sync: subscription error", err);
    // We already linked the customer; failing to read subs isn't fatal
    return new NextResponse(null, { status: 204 });
  }
}
