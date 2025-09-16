// Preview stub: Stripe disabled
export const runtime = "node"; // keep it simple

export async function POST() {
  // In real code we would create a checkout session with Stripe here.
  return Response.json({
    ok: true,
    message: "Stripe checkout disabled on preview.",
  });
}

export async function GET() {
  return Response.json({
    ok: true,
    message: "Stripe checkout disabled on preview.",
  });
}
