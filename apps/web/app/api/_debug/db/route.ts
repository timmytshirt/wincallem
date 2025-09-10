export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  const a = process.env.DATABASE_URL || "";
  const b = process.env.DIRECT_DATABASE_URL || "";
  return NextResponse.json({
    dbUrlPrefix: a.slice(0, 12),   // expect "postgresql://"
    directPrefix: b.slice(0, 12),  // expect "postgresql://"
  });
}
