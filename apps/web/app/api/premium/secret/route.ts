// apps/web/app/api/premium/secret/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { hasActiveSub } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session as any)?.uid as string | undefined;

  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await hasActiveSub(uid))) {
    return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }

  // ✅ Premium-only response
  return NextResponse.json({ secretData: "🎟️ premium content" });
}
