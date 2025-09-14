// apps/web/app/api/dev/backfill-plan/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const starter = process.env.STRIPE_PRICE_ID_STARTER;
  const pro = process.env.STRIPE_PRICE_ID_PRO;

  let updated = 0;
  if (starter) {
    const r = await prisma.subscription.updateMany({
      where: { plan: null, priceId: starter },
      data: { plan: "starter" },
    });
    updated += r.count;
  }
  if (pro) {
    const r = await prisma.subscription.updateMany({
      where: { plan: null, priceId: pro },
      data: { plan: "pro" },
    });
    updated += r.count;
  }
  return NextResponse.json({ ok: true, updated });
}
