export async function POST() {
  return Response.json({ ok: true, message: "Stripe checkout disabled on preview." });
}
export async function GET() {
  return Response.json({ ok: true, message: "Stripe checkout disabled on preview." });
}

