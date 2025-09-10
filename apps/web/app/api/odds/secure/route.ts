// apps/web/app/api/odds/secure/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs"; // ensure Node runtime for this handler

export async function GET(req: NextRequest) {
  // Get the raw signed JWT (string), not the decoded object
  const raw = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET, // must match API AUTH_SECRET
    raw: true,
  });

  if (!raw) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const base = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

  const r = await fetch(`${base}/odds/secure`, {
    headers: { Authorization: `Bearer ${raw}` },
    cache: "no-store",
  });

  return new NextResponse(await r.text(), {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
  });
}
