// apps/web/app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";

async function getHandler() {
  // Belt & suspenders: load .env.local and .env before building options
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
  config({ path: ".env" });

  const { default: NextAuth } = await import("next-auth");
  const { buildAuthOptions } = await import("@/app/lib/auth");
  return NextAuth(buildAuthOptions());
}

export async function GET(req: NextRequest, ctx: any) {
  const handler = await getHandler();
  // @ts-ignore NextAuth returns a handler function
  return handler(req, ctx);
}

export async function POST(req: NextRequest, ctx: any) {
  const handler = await getHandler();
  // @ts-ignore
  return handler(req, ctx);
}
