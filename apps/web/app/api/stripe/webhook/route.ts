// apps/web/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getStripe } from "@/lib/stripe";   // ✅ lazy init

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Stripe requires the raw body for signature verification
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe(); // ✅ construct only at runtime

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
        const subscriptionId = (s.subscription as string) ?? null;
        const priceId =
          s?.line_items?.[0]?.price?.id ??
          s?.metadata?.priceId ??
          null;

        await prisma.subscription.upsert({
          where: { stripeCustomerId: customerId },
          update: {
            stripeSubscriptionId: subscriptionId || undefined,
            priceId: priceId || undefined,
            status: "active",
          },
          create: {
            userId: "pending", // backfill later via email link
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            priceId,
            plan: priceId?.includes("pro") ? "pro" : "starter",
            status: "active",
          },
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as any; // Stripe.Subscription
        const customerId = sub.customer as string;

        await prisma.subscription
          .update({
            where: { stripeCustomerId: customerId },
            data: {
              stripeSubscriptionId: sub.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null,
              cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
              canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
              priceId: sub.items?.data?.[0]?.price?.id ?? null,
              plan: sub.items?.data?.[0]?.price?.nickname ?? null,
            },
          })
          .catch(async () => {
            // If not found, create
            await prisma.subscription.create({
              data: {
                userId: "pending",
                stripeCustomerId: customerId,
                stripeSubscriptionId: sub.id,
                status: sub.status,
                currentPeriodEnd: sub.current_period_end
                  ? new Date(sub.current_period_end * 1000)
                  : null,
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
        // ignore other events for now
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

