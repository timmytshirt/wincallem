"use client";

import { useEffect, useState } from "react";

type Game = {
  game_id: string;
  home: string;
  away: string;
  moneyline_home: number;
  moneyline_away: number;
};

type ModelResult = {
  game_id: string;
  home: string;
  away: string;
  moneyline_home: number;
  moneyline_away: number;
  no_vig_home_prob: number;
  no_vig_away_prob: number;
  fair_home_line: number;
  fair_away_line: number;
  value_home_pct: number;
  value_away_pct: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Dashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [results, setResults] = useState<ModelResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/odds`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setGames)
      .catch(console.error);
  }, []);

  async function runModel() {
    setLoading(true);
    setResults(null);
    try {
      const body = { model_name: "no-vig", games };
      const r = await fetch(`${API_URL}/run_model`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      setTaskId(data.task_id);
      poll(data.task_id);
    } catch (e) {
      setLoading(false);
      console.error(e);
    }
  }

  async function poll(id: string) {
    const pollOnce = async () => {
      const r = await fetch(`${API_URL}/results/${id}`, { cache: "no-store" });
      const data = await r.json();
      if (data.state === "SUCCESS") {
        setResults(data.result.results);
        setLoading(false);
        return true;
      }
      return false;
    };
    let tries = 0;
    const t = setInterval(async () => {
      tries += 1;
      const done = await pollOnce();
      if (done || tries > 20) clearInterval(t);
    }, 500);
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">WinCallem — Demo Dashboard</h1>

      <div className="flex items-center gap-3">
        <button
          className="rounded-xl px-4 py-2 bg-black/10 hover:bg-black/20 transition"
          onClick={() => window.location.reload()}
        >
          Refresh Odds
        </button>
        <button
          className="rounded-xl px-4 py-2 bg-black/80 text-white hover:bg-black transition disabled:opacity-50"
          onClick={runModel}
          disabled={!games.length || loading}
        >
          {loading ? "Running…" : "Run No-Vig Value Model"}
        </button>
        {taskId && <span className="text-sm opacity-70">Task: {taskId}</span>}
      </div>

      <div className="rounded-2xl border border-black/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="p-2 text-left">Game</th>
              <th className="p-2 text-right">Home ML</th>
              <th className="p-2 text-right">Away ML</th>
              <th className="p-2 text-right">Home Value %</th>
              <th className="p-2 text-right">Away Value %</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => {
              const row = results?.find((r) => r.game_id === g.game_id);
              return (
                <tr key={g.game_id} className="odd:bg-black/0 even:bg-black/5">
                  <td className="p-2">
                    {g.away} @ {g.home}
                  </td>
                  <td className="p-2 text-right">{g.moneyline_home}</td>
                  <td className="p-2 text-right">{g.moneyline_away}</td>
                  <td className="p-2 text-right">
                    {row ? `${row.value_home_pct}% (fair ${row.fair_home_line})` : "—"}
                  </td>
                  <td className="p-2 text-right">
                    {row ? `${row.value_away_pct}% (fair ${row.fair_away_line})` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

