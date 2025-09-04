import os
import time
from typing import Any, Dict, List, Optional, cast

from celery_app import celery
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

# -----------------------------------------------------------------------------
# Env / App setup
# -----------------------------------------------------------------------------

load_dotenv()

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
]

app = FastAPI(title="WinCallem API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------


class GameOdds(BaseModel):
    game_id: str
    home: str
    away: str
    moneyline_home: int
    moneyline_away: int


class RunModelRequest(BaseModel):
    # Allow fields like "model_name" without Pydantic's protected namespace warning
    model_config = ConfigDict(protected_namespaces=())
    model_name: str = "demo-regression"
    # Free-form params passed through to the Celery task
    params: Dict[str, Any] = Field(default_factory=dict)
    # Optional convenience: include games directly; we’ll merge into params if present
    games: Optional[List[GameOdds]] = None


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok"}


# In-process cache for stubbed odds
_ODDS_CACHE: Dict[str, Any] = {"data": None, "ts": 0.0}


@app.get("/odds", response_model=List[GameOdds])
def odds():
    """
    Return a small, deterministic odds stub. Replace with a real fetch later.
    """
    now = time.time()
    if not _ODDS_CACHE["data"] or now - _ODDS_CACHE["ts"] > 15:
        data: List[Dict[str, Any]] = [
            {
                "game_id": "2025-09-04-NYY-BOS",
                "home": "Red Sox",
                "away": "Yankees",
                "moneyline_home": -120,
                "moneyline_away": +105,
            },
            {
                "game_id": "2025-09-04-LAD-SF",
                "home": "Giants",
                "away": "Dodgers",
                "moneyline_home": +135,
                "moneyline_away": -150,
            },
        ]
        _ODDS_CACHE["data"] = data
        _ODDS_CACHE["ts"] = now
    else:
        data = cast(List[Dict[str, Any]], _ODDS_CACHE["data"])
    return data


@app.post("/run_model")
def run_model(req: RunModelRequest):
    """
    Enqueue the Celery job. We keep compatibility with the original task signature:
        train_demo_model(model_name: str, params: dict)
    If 'games' are provided, they are folded into params under 'games'.
    """
    params = dict(req.params)  # shallow copy to avoid mutating the model
    if req.games:
        params.setdefault("games", [g.model_dump() for g in req.games])

    task = celery.send_task("tasks.train_demo_model", args=[req.model_name, params])
    return {"task_id": task.id, "status": "queued"}


@app.get("/results/{task_id}")
def get_results(task_id: str):
    result = celery.AsyncResult(task_id)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    if result.state == "PENDING":
        return {"task_id": task_id, "state": result.state}
    if result.state == "SUCCESS":
        return {"task_id": task_id, "state": result.state, "result": result.get()}
    # STARTED, RETRY, FAILURE, etc.
    return {"task_id": task_id, "state": result.state, "info": str(result.info)}
