// apps/web/app/models/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { hasActiveSub } from "@/lib/subscription";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // ensure no static caching of gated content

export default async function ModelsPage() {
  const session = await getServerSession(authOptions);
  const uid = (session as any)?.uid as string | undefined;

  if (!uid) {
    // not signed in → send to login, come back to /models
    redirect("/api/auth/signin?callbackUrl=/models");
  }

  const ok = await hasActiveSub(uid);
  if (!ok) {
    // signed in but no sub → send to account to upgrade
    redirect("/account?upgrade=1");
  }

  // Premium content goes here
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Models (Premium)</h1>
      <p className="opacity-80 mt-2">Welcome! Your subscription is active.</p>
    </main>
  );
}
