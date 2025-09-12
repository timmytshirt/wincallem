// apps/web/lib/guards.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { hasActiveSub } from "@/lib/subscription";

export async function requireActiveSub() {
  const session = await getServerSession(authOptions);
  const uid = (session as any)?.uid as string | undefined;

  if (!uid) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!(await hasActiveSub(uid))) {
    return { ok: false as const, res: NextResponse.json({ error: "Payment required" }, { status: 402 }) };
  }

  return { ok: true as const, uid };
}
