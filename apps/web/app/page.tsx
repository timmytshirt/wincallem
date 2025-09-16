"use client";

import { useState } from "react";

export default function Page() {
  const [status, setStatus] = useState<null | string>(null);

  async function checkApi() {
    try {
      const res = await fetch("/api/healthz", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setStatus(`API OK: ${JSON.stringify(json)}`);
    } catch (e: any) {
      setStatus(`API check failed: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <main style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      padding: "2rem"
    }}>
      <div style={{
        maxWidth: 720,
        width: "100%",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: "2rem"
      }}>
        <h1 style={{ fontSize: 28, margin: 0, lineHeight: 1.2 }}>WinCallem</h1>
        <p style={{ opacity: 0.85, marginTop: 8 }}>
          🚧 Under construction. The frontend is live, and the backend will connect as soon as it’s ready.
        </p>

        <div style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginTop: 24,
          flexWrap: "wrap"
        }}>
          <button
            onClick={checkApi}
            style={{
              appearance: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 10,
              cursor: "pointer"
            }}>
            Test API /healthz
          </button>
          <code style={{
            padding: "8px 12px",
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            fontSize: 13
          }}>
            NEXT_PUBLIC_API_URL = {process.env.NEXT_PUBLIC_API_URL ?? "(not set)"}
          </code>
        </div>

        {status && (
          <pre style={{
            marginTop: 16,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: 12,
            fontSize: 13
          }}>{status}</pre>
        )}

        <p style={{ opacity: 0.6, marginTop: 24, fontSize: 12 }}>
          Tip: set <code>NEXT_PUBLIC_API_URL</code> in your Vercel Project → Settings → Environment Variables.
        </p>
      </div>
    </main>
  );
}
