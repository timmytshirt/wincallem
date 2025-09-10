import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createHmac } from "crypto";

export const runtime = "nodejs";

function b64urlJson(obj: any) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function signHS256(secret: string, claims: Record<string, any>, expSeconds = 15 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { iat: now, exp: now + expSeconds, ...claims };
  const h = b64urlJson(header);
  const p = b64urlJson(payload);
  const sig = createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${sig}`;
}

export async function GET(req: NextRequest) {
  // Get decoded claims from NextAuth regardless of how it stores the session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  const mode = (process.env.API_JWT_MODE || "hs256").toLowerCase(); // "hs256" | "raw"
  const base = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

  let bearer: string | null = null;

  if (mode === "raw") {
    // Forward the original NextAuth token as-is (may be JWE if NextAuth flips)
    const raw = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: true });
    if (!raw) return new NextResponse("Unauthorized", { status: 401 });
    bearer = raw as string;
  } else {
    // Default: re-sign a short-lived HS256 JWS so FastAPI always verifies it
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return new NextResponse("Server misconfig: NEXTAUTH_SECRET missing", { status: 500 });
    bearer = signHS256(secret, {
      sub: token.sub,
      email: (token as any).email,
      name: (token as any).name,
    });
  }

  const r = await fetch(`${base}/odds/secure`, {
    headers: { Authorization: `Bearer ${bearer}` },
    cache: "no-store",
  });

  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
  });
}
