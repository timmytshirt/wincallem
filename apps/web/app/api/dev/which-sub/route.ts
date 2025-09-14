// apps/web/app/api/dev/which-sub/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const uid = (session as any)?.uid || (session?.user as any)?.id || null;
  const sub = uid ? await prisma.subscription.findFirst({ where: { userId: uid } }) : null;

  return NextResponse.json({
    uid,
    env: {
      STARTER: process.env.STRIPE_PRICE_ID_STARTER,
      PRO: process.env.STRIPE_PRICE_ID_PRO,
    },
    sub,
  });
}
