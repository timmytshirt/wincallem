import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  const r = await fetch(`${process.env.API_BASE_URL ?? "http://localhost:8000"}/odds/secure`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await r.text();
  return new NextResponse(data, { status: r.status, headers: { "content-type": "application/json" } });
}
