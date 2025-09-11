import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const raw = await req.text(); // raw body (important)
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  if (!sig || !secret) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as any; // Stripe.Checkout.Session
        const customerId = s.customer as string;
        const subscriptionId = s.subscription as string | null;
        const priceId = s?.line_items?.[0]?.price?.id ?? s?.metadata?.priceId ?? null;

        // We don’t have the userId here; we anchor by customerId.
        await prisma.subscription.upsert({
          where: { stripeCustomerId: customerId },
          update: {
            stripeSubscriptionId: subscriptionId || undefined,
            priceId: priceId || undefined,
            status: "active",
          },
          create: {
            userId: "pending", // optional: backfill link later via email match (advanced)
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId || null,
            priceId: priceId || null,
            plan: priceId?.includes("pro") ? "pro" : "starter",
            status: "active",
          },
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted": {
        const sub = event.data.object as any; // Stripe.Subscription
        const customerId = sub.customer as string;
        await prisma.subscription.update({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
            canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
            priceId: sub.items?.data?.[0]?.price?.id ?? null,
            plan: sub.items?.data?.[0]?.price?.nickname ?? null,
          },
        }).catch(async () => {
          // If not found, create (first webhook might be deletion or update)
          await prisma.subscription.create({
            data: {
              userId: "pending",
              stripeCustomerId: customerId,
              stripeSubscriptionId: sub.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
              cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
              canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
              priceId: sub.items?.data?.[0]?.price?.id ?? null,
              plan: sub.items?.data?.[0]?.price?.nickname ?? null,
            },
          });
        });
        break;
      }
      default:
        // ignore others for now
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
