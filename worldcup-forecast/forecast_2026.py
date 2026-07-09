"""
Forecast the remaining 2026 FIFA World Cup knockout matches (quarterfinals
through the final) using the tuned Elo + Poisson/Dixon-Coles model, with
ratings updated live through all 96 matches played so far (group stage,
round of 32, round of 16).

Bracket (confirmed via news search, July 2026):
  QF1: France      vs Morocco     -> SF1 (Dallas, Jul 14) vs winner QF2
  QF2: Spain       vs Belgium     -> SF1
  QF3: Norway      vs England     -> SF2 (Atlanta, Jul 15) vs winner QF4
  QF4: Argentina   vs Switzerland -> SF2
  Losers of SF1/SF2 -> 3rd place match. Winners -> Final.

Knockout matches cannot end in a draw: a 90-minute draw is resolved via a
simulated penalty shootout, modelled as close to a coin flip with only a
small tilt toward the stronger side (shootouts are well documented to be
only weakly related to overall team quality).
"""
from __future__ import annotations
import json
import random
from typing import Dict, Tuple

from eval_wc2026 import run as build_engine
from model import score_matrix, GoalModelParams
from elo import EloEngine

random.seed(42)

QUARTERFINALS = [
    ("France", "Morocco"),
    ("Spain", "Belgium"),
    ("Norway", "England"),
    ("Argentina", "Switzerland"),
]
# SF pairing by QF index: SF1 = winners of QF[0] & QF[1]; SF2 = winners of QF[2] & QF[3]
SF_PAIRS = [(0, 1), (2, 3)]


def shootout_winner(team_a: str, team_b: str, engine: EloEngine) -> str:
    dr = engine.get(team_a) - engine.get(team_b)
    p_a = 0.5 + max(min(dr, 400), -400) / 400 * 0.05  # mild tilt, capped at 55/45
    return team_a if random.random() < p_a else team_b


def sample_winner(home: str, away: str, engine: EloEngine, params: GoalModelParams,
                   neutral: bool = True) -> Tuple[str, int, int]:
    adv = 0.0 if neutral else engine.home_adv
    dr = (engine.get(home) + adv) - engine.get(away)
    from model import expected_goals
    lam_h, lam_a = expected_goals(dr, params)
    mat = score_matrix(lam_h, lam_a, params)
    r = random.random()
    cum = 0.0
    hg = ag = 0
    for i in range(len(mat)):
        for j in range(len(mat[i])):
            cum += mat[i][j]
            if r <= cum:
                hg, ag = i, j
                break
        else:
            continue
        break
    if hg > ag:
        return home, hg, ag
    if ag > hg:
        return away, hg, ag
    return shootout_winner(home, away, engine), hg, ag


def match_probs(home: str, away: str, engine: EloEngine, params: GoalModelParams) -> Dict[str, float]:
    """Probability each side *advances* (win in 90, ET or on penalties)."""
    from model import expected_goals, outcome_probs
    adv = 0.0
    dr = (engine.get(home) + adv) - engine.get(away)
    lam_h, lam_a = expected_goals(dr, params)
    mat = score_matrix(lam_h, lam_a, params)
    p_home, p_draw, p_away = outcome_probs(mat)
    dr_shootout_tilt = max(min(dr, 400), -400) / 400 * 0.05
    p_home_shootout = 0.5 + dr_shootout_tilt
    return {
        home: p_home + p_draw * p_home_shootout,
        away: p_away + p_draw * (1 - p_home_shootout),
        "_draw90": p_draw,
    }


def monte_carlo(engine: EloEngine, params: GoalModelParams, n: int = 50_000) -> Dict[str, Dict[str, float]]:
    reach_sf = {t: 0 for pair in QUARTERFINALS for t in pair}
    reach_final = {t: 0 for pair in QUARTERFINALS for t in pair}
    win_title = {t: 0 for pair in QUARTERFINALS for t in pair}
    third_place = {t: 0 for pair in QUARTERFINALS for t in pair}

    for _ in range(n):
        qf_winners = []
        for home, away in QUARTERFINALS:
            w, _, _ = sample_winner(home, away, engine, params)
            qf_winners.append(w)
            reach_sf[w] += 1

        sf_winners = []
        sf_losers = []
        for i, j in SF_PAIRS:
            h, a = qf_winners[i], qf_winners[j]
            w, _, _ = sample_winner(h, a, engine, params)
            l = a if w == h else h
            sf_winners.append(w)
            sf_losers.append(l)
            reach_final[w] += 1

        champ, _, _ = sample_winner(sf_winners[0], sf_winners[1], engine, params)
        win_title[champ] += 1

        third, _, _ = sample_winner(sf_losers[0], sf_losers[1], engine, params)
        third_place[third] += 1

    def norm(d):
        return {k: v / n for k, v in d.items()}

    return {
        "reach_semifinal": norm(reach_sf),
        "reach_final": norm(reach_final),
        "win_title": norm(win_title),
        "third_place": norm(third_place),
    }


def main():
    import io, contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        engine, params = build_engine()

    print("=== Quarterfinal advance probabilities ===")
    qf_report = {}
    for home, away in QUARTERFINALS:
        p = match_probs(home, away, engine, params)
        qf_report[f"{home} vs {away}"] = p
        print(f"{home:12s} {p[home]*100:5.1f}%   vs   {away:12s} {p[away]*100:5.1f}%   "
              f"(P(90-min draw)={p['_draw90']*100:4.1f}%)")

    print("\n=== Monte Carlo tournament simulation (50,000 runs) ===")
    mc = monte_carlo(engine, params, n=50_000)
    print("\nChampion probability:")
    for team, p in sorted(mc["win_title"].items(), key=lambda kv: -kv[1]):
        if p > 0:
            print(f"  {team:15s} {p*100:5.1f}%")

    print("\nReach final probability:")
    for team, p in sorted(mc["reach_final"].items(), key=lambda kv: -kv[1]):
        if p > 0:
            print(f"  {team:15s} {p*100:5.1f}%")

    with open("results/wc2026_forecast.json", "w") as f:
        json.dump({"quarterfinals": qf_report, "monte_carlo": mc}, f, indent=2)
    print("\nSaved results/wc2026_forecast.json")


if __name__ == "__main__":
    main()
