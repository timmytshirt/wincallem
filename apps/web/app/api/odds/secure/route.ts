import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { SignJWT } from "jose";

export const runtime = "nodejs";

function getSecret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET missing");
  return new TextEncoder().encode(s);
}

async function signApiJwt(payload: Record<string, any>) {
  // issue a short-lived HS256 JWS the API will accept
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function GET(req: NextRequest) {
  // Get the decoded claims (don’t ask for raw)
  const claims = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!claims) return new NextResponse("Unauthorized", { status: 401 });

  // Re-sign as HS256
  const apiJwt = await signApiJwt({
    sub: claims.sub,
    email: (claims as any).email,
    name: (claims as any).name,
    // carry anything else you want the API to see
  });

  const base = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
  const r = await fetch(`${base}/odds/secure`, {
    headers: { Authorization: `Bearer ${apiJwt}` },
    cache: "no-store",
  });

  return new NextResponse(await r.text(), {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
  });
}
