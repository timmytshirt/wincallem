const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function get(path: string) {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

async function post(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}

export async function pingApi() {
  return get("/health");
}

export async function fetchOdds() {
  return get("/odds");
}

export async function runJob(body: { model_name: string; params: any }) {
  return post("/run_model", body);
}

export async function fetchResult(taskId: string) {
  return get(`/results/${taskId}`);
}
