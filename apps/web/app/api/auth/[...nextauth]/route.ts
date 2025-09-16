// apps/web/app/api/auth/[...nextauth]/route.ts
export async function GET() {
  return new Response("Auth disabled on this preview", { status: 200 });
}
export async function POST() {
  return new Response("Auth disabled on this preview", { status: 200 });
}

