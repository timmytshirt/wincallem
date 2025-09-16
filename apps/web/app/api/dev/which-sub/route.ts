// Preview stub: no auth/db here
export async function GET() {
  return Response.json({ ok: true, tier: "free", note: "Preview stub" });
}

