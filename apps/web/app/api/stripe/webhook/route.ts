// apps/web/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Map priceId/metadata → canonical plan
function resolvePlan(priceId?: string | null, metaPlan?: string | null) {
  if (metaPlan === "starter" || metaPlan === "pro") return metaPlan;
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_ID_STARTER) return "starter";
  return null;
}

// Stripe requires the RAW body for signature verification
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !whSecret) {
    return NextResponse.json(
      { error: "Missing Stripe signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message || err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;

        const customerId = s.customer as string;
        const subscriptionId = (s.subscription as string) ?? null;

        // Prefer metadata; fallback to expanded line_items if present
        const priceId =
          (s.metadata as any)?.priceId ??
          (s as any)?.line_items?.data?.[0]?.price?.id ??
          null;

        // Resolve plan using metadata or env price IDs
        const plan = resolvePlan(priceId, (s.metadata as any)?.plan);

        // Resolve email → userId to avoid userId="pending" when possible
        let email =
          s.customer_details?.email ??
          (typeof s.customer === "string"
            ? ((await stripe.customers.retrieve(s.customer)) as any)?.email
            : undefined);
        email = email?.toLowerCase();

        let userId: string | undefined;
        if (email) {
          const user = await prisma.user.findUnique({ where: { email } });
          userId = user?.id;
        }

        // Upsert subscription row
        await prisma.subscription.upsert({
          where: { stripeCustomerId: customerId },
          update: {
            stripeSubscriptionId: subscriptionId || undefined,
            priceId: priceId || undefined,
            plan: plan ?? undefined,
            status: "active",
            ...(userId ? { userId } : {}),
          },
          create: {
            userId: userId ?? "pending",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId ?? undefined,
            priceId: priceId ?? undefined,
            plan: plan ?? undefined,
            status: "active",
          },
        });

        // Optional: fetch subscription to set currentPeriodEnd immediately
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const currentPeriodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : null;
          await prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: { currentPeriodEnd, status: sub.status },
          });
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const status = sub.status; // trialing | active | past_due | canceled | etc.
        const currentPeriodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null;

        await prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: sub.id,
            status,
            currentPeriodEnd,
          },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        // Safety net to refresh status/renewal after successful payment
        const inv = event.data.object as Stripe.Invoice;
        const subId = inv.subscription as string | null;
        if (subId) {
          const s = await stripe.subscriptions.retrieve(subId);
          const currentPeriodEnd = s.current_period_end
            ? new Date(s.current_period_end * 1000)
            : null;
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { status: s.status, currentPeriodEnd },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: sub.customer as string },
          data: { status: "canceled" },
        });
        break;
      }

      default:
        // no-op for other events
        break;
    }

    // Ack fast so Stripe doesn't retry
    return new NextResponse("ok");
  } catch (err: any) {
    console.error("Webhook handler error:", err?.message || err);
    // Still 200 to avoid retry storms; switch to 500 if you prefer Stripe retries.
    return new NextResponse("ok");
  }
}
