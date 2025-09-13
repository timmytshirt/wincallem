export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEYS = [
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "MAILTRAP_HOST",
  "MAILTRAP_PORT",
  "MAILTRAP_USER",
  "MAILTRAP_PASS",
  "EMAIL_FROM",
];

export async function GET() {
  const data = Object.fromEntries(
    KEYS.map((k) => {
      const v = process.env[k];
      return [
        k,
        v
          ? { present: true, length: v.length, sample: v.slice(0, 4) + "…" }
          : { present: false },
      ];
    })
  );
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
