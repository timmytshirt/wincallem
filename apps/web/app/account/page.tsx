// apps/web/app/account/page.tsx

import AccountPlan from "@/components/AccountPlan";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";   // ✅ fixed: use @/lib, not @/app/lib
import { headers } from "next/headers";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  // Fire-and-forget sync on server render
  // Ensures Stripe subscription rows are linked to the logged-in user
  const h = headers();
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/billing/sync`, {
    method: "POST",
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  }).catch(() => {});

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <div className="rounded-xl border p-4">
        <p className="mb-2">
          Signed in as:{" "}
          <strong>{session?.user?.email ?? "Unknown"}</strong>
        </p>
        <AccountPlan />
      </div>
    </div>
  );
}
