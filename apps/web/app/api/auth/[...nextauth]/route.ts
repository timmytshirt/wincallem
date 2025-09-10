export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";

async function getHandler() {
  // Try to load .env.local/.env just in case
  if (!process.env.DATABASE_URL) {
    const { config } = await import("dotenv");
    config({ path: ".env.local" });
    if (!process.env.DATABASE_URL) config({ path: ".env" });
  }
  const { default: NextAuth } = await import("next-auth");
  const { buildAuthOptions } = await import("@/app/lib/auth");
  return NextAuth(buildAuthOptions());
}

export async function GET(req: NextRequest, ctx: any) {
  const handler = await getHandler();
  // @ts-ignore NextAuth returns a handler
  return handler(req, ctx);
}

export async function POST(req: NextRequest, ctx: any) {
  const handler = await getHandler();
  // @ts-ignore
  return handler(req, ctx);
}



