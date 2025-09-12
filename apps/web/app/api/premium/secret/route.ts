import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { hasActiveSub, prisma } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Preferred: uid from JWT callback
    let uid = (session as any)?.uid as string | undefined;

    // Fallback: resolve uid by email (catch errors so we never 500)
    if (!uid && session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        uid = user?.id;
      } catch (err) {
        console.warn("User lookup failed:", err);
      }
    }

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fail closed if DB/sub check errors internally
    const ok = await hasActiveSub(uid);
    if (!ok) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    return NextResponse.json({ secretData: "🎟️ premium content" });
  } catch (e: any) {
    console.error("premium/secret error:", e?.message || e);
    // never expose internals to client
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
