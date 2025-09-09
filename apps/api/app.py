import os
import time
from typing import Any, Dict, List, cast

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# -----------------------------------------------------------------------------
# Env / App setup
# -----------------------------------------------------------------------------
load_dotenv()

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
]
AUTH_SECRET = os.getenv("AUTH_SECRET")

app = FastAPI(title="WinCallem API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Auth guard
# -----------------------------------------------------------------------------
def verify_jwt(req: Request):
    auth = req.headers.get("authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = auth.split(" ", 1)[1]
    if not AUTH_SECRET:
        raise HTTPException(status_code=500, detail="AUTH_SECRET not set on API")
    try:
        # Accept common HMAC algs used by NextAuth; skip audience check
        payload = jwt.decode(
            token,
            AUTH_SECRET,
            algorithms=["HS256", "HS384", "HS512"],
            options={"verify_aud": False},
        )
        return payload  # contains sub, email, name, etc. from NextAuth
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class GameOdds(BaseModel):
    # identifiers
    game_id: str
    home: str
    away: str

    # moneyline
    moneyline_home: int
    moneyline_away: int

    # spread (line + odds per side)
    spread_home_line: float
    spread_home_odds: int
    spread_away_line: float
    spread_away_odds: int

    # total (shared line + O/U odds)
    total_line: float
    total_over_odds: int
    total_under_odds: int


# -----------------------------------------------------------------------------
# Odds stub (shared by public and secure endpoints)
# -----------------------------------------------------------------------------
_ODDS_CACHE: Dict[str, Any] = {"data": None, "ts": 0.0}


def get_stub_odds() -> List[Dict[str, Any]]:
    now = time.time()
    if not _ODDS_CACHE["data"] or now - _ODDS_CACHE["ts"] > 15:
        data: List[Dict[str, Any]] = [
            {
                "game_id": "2025-09-04-NYY-BOS",
                "home": "Red Sox",
                "away": "Yankees",
                "moneyline_home": -120,
                "moneyline_away": +105,
                # Spread (example: BOS -1.5, NYY +1.5)
                "spread_home_line": -1.5,
                "spread_home_odds": +150,
                "spread_away_line": +1.5,
                "spread_away_odds": -170,
                # Total (example: 8.5 with symmetric juice)
                "total_line": 8.5,
                "total_over_odds": -110,
                "total_under_odds": -110,
            },
            {
                "game_id": "2025-09-04-LAD-SF",
                "home": "Giants",
                "away": "Dodgers",
                "moneyline_home": +135,
                "moneyline_away": -150,
                # Spread (example: SF +1.5, LAD -1.5)
                "spread_home_line": +1.5,
                "spread_home_odds": -155,
                "spread_away_line": -1.5,
                "spread_away_odds": +140,
                # Total
                "total_line": 7.5,
                "total_over_odds": -108,
                "total_under_odds": -112,
            },
        ]
        _ODDS_CACHE["data"] = data
        _ODDS_CACHE["ts"] = now
    return cast(List[Dict[str, Any]], _ODDS_CACHE["data"])


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


# Public odds (no auth)
@app.get("/odds", response_model=List[GameOdds])
def odds():
    return get_stub_odds()


# Secure odds (JWT required)
@app.get("/odds/secure", response_model=List[GameOdds])
def odds_secure(user=Depends(verify_jwt)):
    return get_stub_odds()


# Simple protected route to test JWT wiring
@app.get("/protected")
def protected(user=Depends(verify_jwt)):
    return {"ok": True, "sub": user.get("sub"), "email": user.get("email")}
