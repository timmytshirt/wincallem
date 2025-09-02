import os
import time
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from celery_app import celery

load_dotenv()

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]

app = FastAPI(title="WinCallem API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RunModelRequest(BaseModel):
    model_name: str = "demo-regression"
    params: dict = {}

@app.get("/health")
def health():
    return {"status": "ok"}

# Simple in-process cache for mocked odds
_ODDS_CACHE = {"data": None, "ts": 0.0}

@app.get("/odds")
def odds():
    now = time.time()
    if not _ODDS_CACHE["data"] or now - _ODDS_CACHE["ts"] > 15:
        # Mocked data; replace with real fetch & Redis/DuckDB caching later
        _ODDS_CACHE["data"] = [
            {"game_id": "2025-08-21-NYY-BOS", "home": "Red Sox", "away": "Yankees", "moneyline_home": -120, "moneyline_away": +105},
            {"game_id": "2025-08-21-LAD-SF", "home": "Giants", "away": "Dodgers", "moneyline_home": +135, "moneyline_away": -150},
        ]
        _ODDS_CACHE["ts"] = now
    return {"updated_at": _ODDS_CACHE["ts"], "odds": _ODDS_CACHE["data"]}

@app.post("/run_model")
def run_model(req: RunModelRequest):
    # Enqueue a Celery job
    task = celery.send_task("tasks.train_demo_model", args=[req.model_name, req.params])
    return {"task_id": task.id, "status": "queued"}

@app.get("/results/{task_id}")
def get_results(task_id: str):
    result = celery.AsyncResult(task_id)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    if result.state == "PENDING":
        return {"task_id": task_id, "state": result.state}
    elif result.state == "SUCCESS":
        return {"task_id": task_id, "state": result.state, "result": result.get()}
    else:
        # includes STARTED, RETRY, FAILURE
        return {"task_id": task_id, "state": result.state, "info": str(result.info)}
