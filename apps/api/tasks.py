# apps/api/tasks.py
from __future__ import annotations

import time
from typing import Any, Dict, List, cast

from celery_app import celery


def american_to_prob(odds: int) -> float:
    """Implied probability from American odds (with vig)."""
    if odds < 0:
        return (-odds) / ((-odds) + 100)
    return 100 / (odds + 100)


def prob_to_american(p: float) -> int:
    """Convert probability to American odds, rounded to the nearest 5."""
    p = min(max(p, 1e-6), 1 - 1e-6)
    if p >= 0.5:
        return -int(round((p / (1 - p)) * 100 / 5.0)) * 5
    return int(round(((1 - p) / p) * 100 / 5.0)) * 5


def normalize_no_vig(p1: float, p2: float) -> tuple[float, float]:
    """Remove vig by normalizing the two implied probabilities to sum to 1."""
    s = p1 + p2
    if s <= 0:
        return 0.5, 0.5
    return p1 / s, p2 / s


def decimal_payout(odds: int) -> float:
    """Return decimal multiple for a $1 stake (e.g., +150 => 2.5x, -120 => 1.833x)."""
    if odds > 0:
        return 1 + odds / 100.0
    return 1 + 100.0 / abs(odds)


def edge_percent(fair_p: float, market_odds: int) -> float:
    """
    Expected ROI per $1 stake, in percent.
    EV = fair_p * (decimal - 1) - (1 - fair_p) * 1
    """
    dec = decimal_payout(market_odds)
    ev = fair_p * (dec - 1.0) - (1.0 - fair_p) * 1.0
    return round(ev * 100, 2)


@celery.task(name="tasks.train_demo_model")
def train_demo_model(model_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    No-vig value finder.
    Expects params['games'] = List[Dict[str, Any]] with keys:
      game_id, home, away, moneyline_home, moneyline_away
    """
    games = cast(List[Dict[str, Any]], params.get("games", []))

    # Small pause to simulate work
    time.sleep(0.2)

    results: List[Dict[str, Any]] = []
    for g in games:
        ml_h = int(g["moneyline_home"])
        ml_a = int(g["moneyline_away"])

        p_h_raw = american_to_prob(ml_h)
        p_a_raw = american_to_prob(ml_a)
        p_h_nv, p_a_nv = normalize_no_vig(p_h_raw, p_a_raw)

        results.append(
            {
                **g,
                "no_vig_home_prob": round(p_h_nv, 4),
                "no_vig_away_prob": round(p_a_nv, 4),
                "fair_home_line": prob_to_american(p_h_nv),
                "fair_away_line": prob_to_american(p_a_nv),
                "value_home_pct": edge_percent(p_h_nv, ml_h),
                "value_away_pct": edge_percent(p_a_nv, ml_a),
            }
        )

    return {"count": len(results), "results": results}
