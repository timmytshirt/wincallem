import Link from "next/link";

export default function Home() {
  return (
    <main className="space-y-6">
      <h2 className="text-xl font-semibold">MVP Boilerplate</h2>
      <p className="opacity-90">
        Next.js frontend + FastAPI + Celery worker + Redis. Use the dashboard to hit the API.
      </p>
      <Link href="/dashboard" className="inline-block rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20">
        Go to Dashboard
      </Link>
    </main>
  );
}
