"use client";

import { useState } from "react";
import { pingApi, fetchOdds, runJob, fetchResult } from "../lib/api";

export default function Dashboard() {
  const [health, setHealth] = useState<string>("");
  const [odds, setOdds] = useState<any>(null);
  const [taskId, setTaskId] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  return (
    <main className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      <section className="space-x-2">
        <button
          className="rounded bg-white/10 px-3 py-2 hover:bg-white/20"
          onClick={async () => setHealth(JSON.stringify(await pingApi()))}
        >
          Ping API
        </button>
        <span className="text-sm opacity-80">{health}</span>
      </section>

      <section className="space-y-2">
        <button
          className="rounded bg-white/10 px-3 py-2 hover:bg-white/20"
          onClick={async () => setOdds(await fetchOdds())}
        >
          Fetch Odds
        </button>
        {odds && (
          <pre className="rounded bg-black/30 p-3 text-xs overflow-x-auto">
            {JSON.stringify(odds, null, 2)}
          </pre>
        )}
      </section>

      <section className="space-y-2">
        <div className="space-x-2">
          <button
            className="rounded bg-white/10 px-3 py-2 hover:bg-white/20"
            onClick={async () => {
              const res = await runJob({ model_name: "demo-regression", params: { seed: 42 } });
              setTaskId(res.task_id);
              setResult(null);
            }}
          >
            Run Model Job
          </button>
          {taskId && <span className="text-sm opacity-80">task_id: {taskId}</span>}
        </div>

        {taskId && (
          <button
            className="rounded bg-white/10 px-3 py-2 hover:bg-white/20"
            onClick={async () => {
              const res = await fetchResult(taskId);
              setResult(res);
            }}
          >
            Check Result
          </button>
        )}

        {result && (
          <pre className="rounded bg-black/30 p-3 text-xs overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}
