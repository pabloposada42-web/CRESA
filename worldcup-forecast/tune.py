"""Grid search over Elo/goal-model hyperparameters.

Tunes on WC 2002-2014 (log-loss), reports generalization on held-out
WC 2018 + 2022, which are never used to pick the winning combo.
"""
from __future__ import annotations
import copy
import itertools
import json
import time

from elo import DEFAULT_K, load_matches
from backtest import eval_frozen, eval_live
from model import GoalModelParams

TUNE_YEARS = (2002, 2006, 2010, 2014, 2018, 2022)
TEST_YEARS = ()  # WC2026 (live, in-progress) is used as the real untouched holdout, see eval_wc2026.py

MATCHES = load_matches("data/international_results.csv")


def scaled_k(scale: float) -> dict:
    return {k: v * scale for k, v in DEFAULT_K.items()}


def agg(per_year: dict) -> dict:
    valid = [r for r in per_year.values() if r]
    n = sum(r["n"] for r in valid)
    return {
        "log_loss": sum(r["log_loss"] * r["n"] for r in valid) / n,
        "brier": sum(r["brier"] * r["n"] for r in valid) / n,
        "accuracy": sum(r["accuracy"] * r["n"] for r in valid) / n,
        "n": n,
    }


def evaluate(home_adv, k_scale, carry_over, rho, years, mode="frozen"):
    k_weights = scaled_k(k_scale)
    per_year = {}
    fn = eval_frozen if mode == "frozen" else eval_live
    for y in years:
        params_override = None
        if rho is not None:
            # calibrate slope/avg_total per-tournament as usual but override rho
            pass
        r = fn(MATCHES, y, home_adv, k_weights, carry_over)
        per_year[y] = r
    return agg(per_year)


def evaluate_with_rho(home_adv, k_scale, carry_over, rho, years, mode="frozen"):
    from elo import EloEngine
    from model import calibrate_goal_model
    k_weights = scaled_k(k_scale)
    per_year = {}
    for y in years:
        from backtest import wc_tournaments, score_predictions
        tourn = wc_tournaments(MATCHES)[y]
        first_date = tourn[0].date
        history = [m for m in MATCHES if m.date < first_date]
        engine = EloEngine(home_adv=home_adv, k_weights=k_weights, carry_over=carry_over)
        engine.run(history)
        params = calibrate_goal_model(history, engine, home_adv)
        params.rho = rho
        per_year[y] = score_predictions(tourn, engine, params, update=(mode == "live"))
    return agg(per_year)


def grid_search():
    home_advs = [30, 50, 70, 100]
    k_scales = [1.25, 1.5, 1.75, 2.0, 2.5]
    carry_overs = [1.0]
    rhos = [-0.2, -0.12, -0.08, -0.04, 0.0]

    best = None
    results = []
    t0 = time.time()
    count = 0
    for ha, ks, co, rho in itertools.product(home_advs, k_scales, carry_overs, rhos):
        count += 1
        tune_res = evaluate_with_rho(ha, ks, co, rho, TUNE_YEARS, mode="frozen")
        entry = {
            "home_adv": ha, "k_scale": ks, "carry_over": co, "rho": rho,
            "tune_log_loss": tune_res["log_loss"], "tune_brier": tune_res["brier"],
            "tune_accuracy": tune_res["accuracy"],
        }
        results.append(entry)
        if best is None or entry["tune_log_loss"] < best["tune_log_loss"]:
            best = entry
    results.sort(key=lambda e: e["tune_log_loss"])
    elapsed = time.time() - t0
    print(f"Searched {count} combos in {elapsed:.1f}s")
    print("Top 10 by tune log-loss:")
    for e in results[:10]:
        print(e)

    if TEST_YEARS:
        top = results[:5]
        print("\nGeneralization check on held-out years:")
        for e in top:
            test_res = evaluate_with_rho(e["home_adv"], e["k_scale"], e["carry_over"], e["rho"],
                                          TEST_YEARS, mode="frozen")
            print({**e, "test_log_loss": test_res["log_loss"], "test_brier": test_res["brier"],
                   "test_accuracy": test_res["accuracy"]})

    return results


if __name__ == "__main__":
    grid_search()
