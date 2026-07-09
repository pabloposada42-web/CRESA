"""
Backtest the Elo + Poisson forecasting model against real World Cup history.

Two evaluation regimes:

1. "Frozen pre-tournament" — for each past World Cup finals tournament, ratings
   are computed from all matches strictly before the tournament's first match,
   then used *unchanged* to predict every match of that tournament (mirrors a
   forecaster who published all picks before ball one).

2. "Live" — matches of a tournament are predicted sequentially, updating Elo
   after each result (mirrors a forecaster re-issuing odds after every round).

Metrics: log-loss (lower better), Brier score (lower better), accuracy of the
most-likely outcome (higher better, informational only -- draws make a pure
accuracy target noisy).
"""
from __future__ import annotations
import json
import math
import sys
from collections import defaultdict
from typing import Dict, List, Tuple

from elo import EloEngine, Match, load_matches, DEFAULT_K
from model import GoalModelParams, calibrate_goal_model, predict_match

DATA_PATH = "data/international_results.csv"
WC = "FIFA World Cup"


def result_vec(hs: int, as_: int) -> Tuple[float, float, float]:
    if hs > as_:
        return (1.0, 0.0, 0.0)
    if hs == as_:
        return (0.0, 1.0, 0.0)
    return (0.0, 0.0, 1.0)


def log_loss(p: Tuple[float, float, float], y: Tuple[float, float, float], eps=1e-12) -> float:
    return -sum(yi * math.log(max(pi, eps)) for pi, yi in zip(p, y))


def brier(p: Tuple[float, float, float], y: Tuple[float, float, float]) -> float:
    return sum((pi - yi) ** 2 for pi, yi in zip(p, y))


def wc_tournaments(matches: List[Match]) -> Dict[int, List[Match]]:
    by_year: Dict[int, List[Match]] = defaultdict(list)
    for m in matches:
        if m.tournament == WC:
            by_year[m.date.year].append(m)
    for y in by_year:
        by_year[y].sort(key=lambda m: m.date)
    return by_year


def eval_frozen(matches: List[Match], year: int, home_adv: float, k_weights: dict,
                 carry_over: float, params_override: GoalModelParams = None) -> dict:
    tourn = wc_tournaments(matches)[year]
    if not any(m.home_score is not None for m in tourn):
        return {}
    played = [m for m in tourn]
    first_date = played[0].date
    history = [m for m in matches if m.date < first_date]

    engine = EloEngine(home_adv=home_adv, k_weights=k_weights, carry_over=carry_over)
    engine.run(history)
    params = params_override or calibrate_goal_model(history, engine, home_adv)

    return score_predictions(played, engine, params, update=False)


def eval_live(matches: List[Match], year: int, home_adv: float, k_weights: dict,
              carry_over: float, params_override: GoalModelParams = None) -> dict:
    tourn = wc_tournaments(matches)[year]
    played = tourn
    first_date = played[0].date
    history = [m for m in matches if m.date < first_date]

    engine = EloEngine(home_adv=home_adv, k_weights=k_weights, carry_over=carry_over)
    engine.run(history)
    params = params_override or calibrate_goal_model(history, engine, home_adv)

    return score_predictions(played, engine, params, update=True)


def score_predictions(played: List[Match], engine: EloEngine, params: GoalModelParams,
                       update: bool) -> dict:
    n = 0
    ll_sum = 0.0
    br_sum = 0.0
    correct = 0
    for m in played:
        p_home, p_draw, p_away, lam_h, lam_a = predict_match(m.home, m.away, m.neutral, engine, params)
        y = result_vec(m.home_score, m.away_score)
        ll_sum += log_loss((p_home, p_draw, p_away), y)
        br_sum += brier((p_home, p_draw, p_away), y)
        pred_idx = max(range(3), key=lambda i: (p_home, p_draw, p_away)[i])
        actual_idx = max(range(3), key=lambda i: y[i])
        if pred_idx == actual_idx:
            correct += 1
        n += 1
        if update:
            engine.update(m)
    return {
        "n": n,
        "log_loss": ll_sum / n if n else None,
        "brier": br_sum / n if n else None,
        "accuracy": correct / n if n else None,
    }


def run_backtest(home_adv: float, k_weights: dict, carry_over: float,
                  params_override: GoalModelParams = None, years=(2002, 2006, 2010, 2014, 2018, 2022),
                  mode: str = "frozen") -> dict:
    matches = load_matches(DATA_PATH)
    results = {}
    fn = eval_frozen if mode == "frozen" else eval_live
    for y in years:
        results[y] = fn(matches, y, home_adv, k_weights, carry_over, params_override)
    valid = [r for r in results.values() if r]
    agg = {
        "log_loss": sum(r["log_loss"] * r["n"] for r in valid) / sum(r["n"] for r in valid),
        "brier": sum(r["brier"] * r["n"] for r in valid) / sum(r["n"] for r in valid),
        "accuracy": sum(r["accuracy"] * r["n"] for r in valid) / sum(r["n"] for r in valid),
        "n": sum(r["n"] for r in valid),
    }
    return {"per_year": results, "aggregate": agg}


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "frozen"
    res = run_backtest(home_adv=100.0, k_weights=DEFAULT_K, carry_over=1.0, mode=mode)
    print(json.dumps(res, indent=2, default=str))
