// apps/web/components/AccountPlanButtons.tsx
"use client";

import { useState } from "react";

type Plan = "starter" | "pro";

export default function AccountPlanButtons({
  starterPriceId,
  proPriceId,
  hasCustomer,
  isActive,
}: {
  starterPriceId: string;
  proPriceId: string;
  hasCustomer: boolean;
  isActive: boolean;
}) {
  const [busy, setBusy] = useState<Plan | "portal" | null>(null);

  async function startCheckout(priceId: string, plan: Plan) {
    try {
      setBusy(plan);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          plan, // optional; webhook reads metadata/priceId
          successUrl: `${location.origin}/account?status=success`,
          cancelUrl: `${location.origin}/account?status=cancelled`,
        }),
      });
      const data = await res.json();
      if (data?.url) location.href = data.url;
      else alert(data?.error || "Checkout error");
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    try {
      setBusy("portal");
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) location.href = data.url;
      else alert(data?.error || "Portal error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2" aria-busy={!!busy}>
      {/* Only show subscribe buttons if NOT active */}
      {!isActive && (
        <>
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={!!busy || !starterPriceId}
            onClick={() => startCheckout(starterPriceId, "starter")}
          >
            {busy === "starter" ? "Opening…" : "Subscribe: Starter"}
          </button>

          <button
            className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
            disabled={!!busy || !proPriceId}
            onClick={() => startCheckout(proPriceId, "pro")}
          >
            {busy === "pro" ? "Opening…" : "Subscribe: Pro"}
          </button>
        </>
      )}

      {/* Manage Billing visible always, but only enabled when customer+active */}
      <button
        className="px-3 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
        onClick={openPortal}
        disabled={!hasCustomer || !isActive || !!busy}
        title={
          !hasCustomer
            ? "Create a subscription first"
            : !isActive
            ? "Subscription not active"
            : ""
        }
      >
        {busy === "portal" ? "Opening…" : "Manage Billing"}
      </button>
    </div>
  );
}
