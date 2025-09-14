// apps/web/app/account/page.tsx
import React from "react";
import AccountPlan from "@/components/AccountPlan";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

function siteUrl() {
  const h = headers();
  const proto =
    h.get("x-forwarded-proto") ||
    (process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https") ? "https" : "http");
  const host =
    h.get("x-forwarded-host") ||
    h.get("host") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ||
    "localhost:3000";
  return `${proto}://${host}`;
}

function fmt(dt?: Date | null) {
  return dt ? new Date(dt).toLocaleString() : "—";
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Account</h1>
        <div className="rounded-xl border p-4">
          <p className="mb-2">You’re not signed in.</p>
          <p className="text-sm text-gray-500">
            Please sign in to view your subscription and manage billing.
          </p>
        </div>
      </div>
    );
  }

  // --- Ensure webhook → DB is reconciled before we read ---
  try {
    await fetch(`${siteUrl()}/api/billing/sync`, {
      method: "POST",
      headers: { cookie: headers().get("cookie") ?? "" },
      cache: "no-store",
    });
  } catch {
    // swallow; we'll still show whatever is in DB
  }

  // Identify user; your NextAuth callbacks may set `uid` on the session
  const uid =
    (session as any)?.uid ||
    (session.user as any)?.id || // if you attach id to session.user
    null;

  // Read subscription linked to this user (adjust if you store differently)
  const sub = uid
    ? await prisma.subscription.findFirst({
        where: { userId: uid as string },
      })
    : null;

  const plan = sub?.plan ?? null;
  const status = sub?.status ?? null;
  const renews = sub?.currentPeriodEnd ?? null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <p>
          Signed in as: <strong>{session.user?.email ?? "Unknown"}</strong>
        </p>

        <div className="rounded-lg border p-3 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Subscription</div>
              <div className="text-base">
                Plan: <strong>{plan ?? "None"}</strong>
              </div>
              <div className="text-base">
                Status: <strong>{status ?? "—"}</strong>
              </div>
              {renews && (
                <div className="text-sm text-gray-600">
                  Renews: <strong>{fmt(renews)}</strong>
                </div>
              )}
            </div>

            {/* Simple status pill */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === "active" || status === "trialing"
                  ? "bg-green-100 text-green-800"
                  : status
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {status ?? "no-subscription"}
            </span>
          </div>
        </div>

        {/* Your existing purchase/portal UI */}
        <AccountPlan />
      </div>
    </div>
  );
}
