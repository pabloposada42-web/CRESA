"""
Evaluate the model against the real, already-played 2026 World Cup matches
(group stage through quarter-finals) as an in-domain, most-recent validation
set. Ratings are updated live, match by match, exactly mirroring how a
forecaster would have operated in real time during the tournament.
"""
from __future__ import annotations
import json
import sys

from elo import EloEngine, load_matches, DEFAULT_K
from model import calibrate_goal_model
from backtest import wc_tournaments, score_predictions

DATA_PATH = "data/international_results.csv"


def run(home_adv=100.0, k_scale=1.0, carry_over=1.0, rho=-0.08):
    k_weights = {k: v * k_scale for k, v in DEFAULT_K.items()}
    matches = load_matches(DATA_PATH)
    tourn2026 = wc_tournaments(matches)[2026]
    played = [m for m in tourn2026 if m.home_score is not None]
    first_date = played[0].date
    history = [m for m in matches if m.date < first_date]

    engine = EloEngine(home_adv=home_adv, k_weights=k_weights, carry_over=carry_over)
    engine.run(history)
    params = calibrate_goal_model(history, engine, home_adv)
    params.rho = rho

    result = score_predictions(played, engine, params, update=True)
    print(json.dumps(result, indent=2))
    # show current top-20 ratings after full live update through quarterfinals
    ranked = sorted(engine.ratings.items(), key=lambda kv: -kv[1])[:20]
    print("\nTop 20 Elo ratings after WC2026 quarterfinals:")
    for team, r in ranked:
        print(f"  {team:25s} {r:.1f}")
    return engine, params


if __name__ == "__main__":
    run()
