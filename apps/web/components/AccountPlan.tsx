// apps/web/components/AccountPlan.tsx
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import React from "react";
import AccountPlanButtons from "@/components/AccountPlanButtons";

/** Prisma singleton for dev HMR */
const g = globalThis as unknown as { prisma?: PrismaClient };
const prisma = g.prisma ?? new PrismaClient();
if (!g.prisma) g.prisma = prisma;

function fmt(d?: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function AccountPlan() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  // If not signed in, keep UI simple and avoid DB work
  if (!userId) {
    return (
      <div className="space-y-2">
        <div className="grid gap-1 text-sm">
          <div>
            <span className="font-semibold">Plan:</span> —
          </div>
          <div>
            <span className="font-semibold">Status:</span> —
          </div>
          <div>
            <span className="font-semibold">Renews:</span> —
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Sign in to subscribe and manage billing.
        </p>
      </div>
    );
  }

  // Pull latest subscription snapshot for this user
  const sub = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      stripeCustomerId: true,
      plan: true,
      priceId: true,
      status: true,
      currentPeriodEnd: true,
    },
  });

  // Read price IDs from env; guard if missing
  const starterPriceId = process.env.STRIPE_PRICE_ID_STARTER ?? "";
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO ?? "";

  const hasCustomer = !!sub?.stripeCustomerId;
  const isActive = !!sub?.status && ["active", "trialing"].includes(sub.status);

  return (
    <div className="space-y-3">
      <div className="grid gap-1 text-sm">
        <div>
          <span className="font-semibold">Plan:</span>{" "}
          {sub?.plan ?? sub?.priceId ?? "None"}
        </div>
        <div>
          <span className="font-semibold">Status:</span>{" "}
          {sub?.status ?? "—"}
        </div>
        <div>
          <span className="font-semibold">Renews:</span>{" "}
          {fmt(sub?.currentPeriodEnd)}
        </div>
      </div>

      <AccountPlanButtons
        starterPriceId={starterPriceId}
        proPriceId={proPriceId}
        hasCustomer={hasCustomer}
        isActive={isActive}
      />

      <p className="text-sm text-gray-500">
        Use “Subscribe” to start a plan. “Manage Billing” opens Stripe’s portal to
        change or cancel.
      </p>
    </div>
  );
}


