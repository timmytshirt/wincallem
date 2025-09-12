import os
import time
from typing import Any, Dict, List, Optional, Set, cast

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

# NOTE: Don't raise at import time; CI doesn't set this for non-auth tests.
AUTH_SECRET: Optional[str] = os.getenv("AUTH_SECRET") or os.getenv("NEXTAUTH_SECRET")

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
def verify_jwt(req: Request) -> Dict[str, Any]:
    auth = req.headers.get("authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = auth.split(" ", 1)[1]

    try:
        # Read header to determine algorithm
        header = jwt.get_unverified_header(token)
        alg_val = header.get("alg")
        if not isinstance(alg_val, str):
            raise HTTPException(status_code=401, detail="Invalid token header: alg")

        # Only allow common HMAC algs (used by NextAuth v4)
        allowed_algs: Set[str] = {"HS256", "HS384", "HS512"}
        if alg_val not in allowed_algs:
            raise HTTPException(status_code=401, detail=f"Invalid token alg: {alg_val}")

        # Require secret only when verifying JWTs
        if AUTH_SECRET is None:
            raise HTTPException(
                status_code=500,
                detail="Server misconfigured: AUTH_SECRET/NEXTAUTH_SECRET is not set",
            )
        secret: str = AUTH_SECRET  # type-narrowing for mypy

        # Verify signature, skip 'aud' check, allow small clock skew
        payload: Dict[str, Any] = jwt.decode(
            token,
            secret,
            algorithms=[alg_val],
            options={"verify_aud": False},
            leeway=30,
        )
        return payload
    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Invalid token: expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class GameOdds(BaseModel):
    game_id: str
    home: str
    away: str
    moneyline_home: int
    moneyline_away: int
    spread_home_line: float
    spread_home_odds: int
    spread_away_line: float
    spread_away_odds: int
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
                "spread_home_line": -1.5,
                "spread_home_odds": +150,
                "spread_away_line": +1.5,
                "spread_away_odds": -170,
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
                "spread_home_line": +1.5,
                "spread_home_odds": -155,
                "spread_away_line": -1.5,
                "spread_away_odds": +140,
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
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/odds", response_model=List[GameOdds])
def odds() -> List[Dict[str, Any]]:
    return get_stub_odds()


@app.get("/odds/secure", response_model=List[GameOdds])
def odds_secure(user: Dict[str, Any] = Depends(verify_jwt)) -> List[Dict[str, Any]]:
    return get_stub_odds()


@app.get("/protected")
def protected(user: Dict[str, Any] = Depends(verify_jwt)) -> Dict[str, Any]:
    return {"ok": True, "sub": user.get("sub"), "email": user.get("email")}
