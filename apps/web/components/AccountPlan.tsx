"use client";

import { useState } from "react";

export default function AccountPlan() {
  const [loading, setLoading] = useState<string | null>(null);

  async function post(url: string, body?: any) {
    setLoading(url);
    const r = await fetch(url, { method: "POST", body: body ? JSON.stringify(body) : undefined });
    const j = await r.json();
    setLoading(null);
    if (j.url) window.location.href = j.url;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white"
          disabled={!!loading}
          onClick={() => post("/api/stripe/checkout", { plan: "starter" })}
        >
          {loading ? "Working..." : "Subscribe: Starter"}
        </button>
        <button
          className="px-3 py-2 rounded bg-indigo-600 text-white"
          disabled={!!loading}
          onClick={() => post("/api/stripe/checkout", { plan: "pro" })}
        >
          {loading ? "Working..." : "Subscribe: Pro"}
        </button>
        <button
          className="px-3 py-2 rounded bg-gray-800 text-white"
          disabled={!!loading}
          onClick={() => post("/api/stripe/portal")}
        >
          {loading ? "Working..." : "Manage billing"}
        </button>
      </div>
      <p className="text-sm text-gray-500">
        After checkout, you’ll be redirected back here. Use “Manage billing” to cancel or change plans.
      </p>
    </div>
  );
}
