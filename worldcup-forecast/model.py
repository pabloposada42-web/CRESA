"""
Goal-scoring model built on top of Elo ratings.

Expected goals for each side are derived from the Elo rating difference via a
linear mapping calibrated by least-squares regression against real historical
goal differences (regression through the origin: gd ~ a * dr).

Match outcome probabilities (home win / draw / away win) and full scoreline
distributions are computed analytically from independent Poisson
distributions, optionally corrected with the Dixon-Coles low-score
dependence adjustment (rho) for more realistic 0-0 / 1-0 / 0-1 / 1-1 rates.
"""
from __future__ import annotations
import math
from dataclasses import dataclass
from typing import List, Tuple

from elo import EloEngine, Match

MAX_GOALS = 10


def poisson_pmf(lam: float, k: int) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * lam ** k / math.factorial(k)


def dixon_coles_tau(hg: int, ag: int, lam_h: float, lam_a: float, rho: float) -> float:
    if hg == 0 and ag == 0:
        return 1 - lam_h * lam_a * rho
    if hg == 0 and ag == 1:
        return 1 + lam_h * rho
    if hg == 1 and ag == 0:
        return 1 + lam_a * rho
    if hg == 1 and ag == 1:
        return 1 - rho
    return 1.0


@dataclass
class GoalModelParams:
    avg_total_goals: float = 2.7
    goal_diff_slope: float = 0.0025   # expected goal-diff per Elo point difference
    rho: float = -0.08                # Dixon-Coles low-score correlation
    min_lambda: float = 0.15


def calibrate_goal_model(matches: List[Match], engine: EloEngine, home_adv: float) -> GoalModelParams:
    """Fit avg_total_goals and goal_diff_slope from (elo_diff, actual outcome) pairs
    collected by replaying history chronologically with a *fresh* engine, mirroring
    the exact ratings each team had immediately before that match."""
    calib_engine = EloEngine(home_adv=engine.home_adv, k_weights=engine.k_weights,
                              start_rating=engine.start_rating, carry_over=engine.carry_over)
    num = 0.0
    den = 0.0
    total_goals_sum = 0.0
    n = 0
    for m in matches:
        adv = 0.0 if m.neutral else calib_engine.home_adv
        dr = (calib_engine.get(m.home) + adv) - calib_engine.get(m.away)
        gd = m.home_score - m.away_score
        num += dr * gd
        den += dr * dr
        total_goals_sum += (m.home_score + m.away_score)
        n += 1
        calib_engine.update(m)
    slope = num / den if den > 0 else 0.0025
    avg_total = total_goals_sum / n if n else 2.7
    return GoalModelParams(avg_total_goals=avg_total, goal_diff_slope=slope)


def expected_goals(elo_diff: float, params: GoalModelParams) -> Tuple[float, float]:
    gd = params.goal_diff_slope * elo_diff
    lam_h = params.avg_total_goals / 2.0 + gd / 2.0
    lam_a = params.avg_total_goals / 2.0 - gd / 2.0
    return max(lam_h, params.min_lambda), max(lam_a, params.min_lambda)


def score_matrix(lam_h: float, lam_a: float, params: GoalModelParams) -> List[List[float]]:
    ph = [poisson_pmf(lam_h, k) for k in range(MAX_GOALS + 1)]
    pa = [poisson_pmf(lam_a, k) for k in range(MAX_GOALS + 1)]
    mat = [[ph[i] * pa[j] for j in range(MAX_GOALS + 1)] for i in range(MAX_GOALS + 1)]
    for i in (0, 1):
        for j in (0, 1):
            mat[i][j] *= dixon_coles_tau(i, j, lam_h, lam_a, params.rho)
    total = sum(sum(row) for row in mat)
    if total > 0:
        mat = [[v / total for v in row] for row in mat]
    return mat


def outcome_probs(mat: List[List[float]]) -> Tuple[float, float, float]:
    p_home = sum(mat[i][j] for i in range(MAX_GOALS + 1) for j in range(MAX_GOALS + 1) if i > j)
    p_draw = sum(mat[i][i] for i in range(MAX_GOALS + 1))
    p_away = sum(mat[i][j] for i in range(MAX_GOALS + 1) for j in range(MAX_GOALS + 1) if i < j)
    return p_home, p_draw, p_away


def predict_match(home: str, away: str, neutral: bool, engine: EloEngine,
                   params: GoalModelParams) -> Tuple[float, float, float, float, float]:
    adv = 0.0 if neutral else engine.home_adv
    dr = (engine.get(home) + adv) - engine.get(away)
    lam_h, lam_a = expected_goals(dr, params)
    mat = score_matrix(lam_h, lam_a, params)
    p_home, p_draw, p_away = outcome_probs(mat)
    return p_home, p_draw, p_away, lam_h, lam_a
