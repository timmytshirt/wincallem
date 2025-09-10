import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createHmac, createHash } from "crypto";

export const runtime = "nodejs";

// TEMP: log a short fingerprint so we can confirm both sides share the same secret
function secretFingerprint(s: string) {
  return createHash("sha256").update(s).digest("hex").slice(0, 8);
}

function base64urlJson(obj: any) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function signHS256(secret: string, claims: Record<string, any>, expSeconds = 15 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { iat: now, exp: now + expSeconds, ...claims };
  const h = base64urlJson(header);
  const p = base64urlJson(payload);
  const data = `${h}.${p}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return new NextResponse("Server misconfig: NEXTAUTH_SECRET missing", { status: 500 });

  // TEMP: log we are actually re-signing + secret fingerprint
  console.log("[proxy] re-signing JWT (HS256), secret fp =", secretFingerprint(secret));

  const apiJwt = signHS256(secret, {
    sub: token.sub,
    email: (token as any).email,
    name: (token as any).name,
  });

  const base = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
  const r = await fetch(`${base}/odds/secure`, {
    headers: { Authorization: `Bearer ${apiJwt}` },
    cache: "no-store",
  });

  // Forward body + status
  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
  });
}
