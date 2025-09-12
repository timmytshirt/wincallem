// apps/web/components/AccountPlan.tsx

"use client";

import { useState } from "react";

export default function AccountPlan() {
  const [loading, setLoading] = useState<string | null>(null);

  async function post(url: string, body?: any) {
    try {
      setLoading(url);
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await r.json();
      if (j.url) {
        window.location.href = j.url;
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={!!loading}
          onClick={() => post("/api/stripe/checkout", { plan: "starter" })}
        >
          {loading === "/api/stripe/checkout" ? "Working…" : "Subscribe: Starter"}
        </button>
        <button
          className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
          disabled={!!loading}
          onClick={() => post("/api/stripe/checkout", { plan: "pro" })}
        >
          {loading === "/api/stripe/checkout" ? "Working…" : "Subscribe: Pro"}
        </button>
        <button
          className="px-3 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
          disabled={!!loading}
          onClick={() => post("/api/stripe/portal")}
        >
          {loading === "/api/stripe/portal" ? "Working…" : "Manage Billing"}
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Use “Subscribe” to start a plan, then “Manage Billing” to cancel or update.
      </p>
    </div>
  );
}
