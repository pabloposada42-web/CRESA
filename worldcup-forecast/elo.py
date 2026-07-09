"""
World Football Elo rating engine.

Methodology follows the well-known "World Football Elo Ratings" approach
(eloratings.net), adapted and tunable:

    R_new = R_old + K * G * (W - We)

    We  = 1 / (10^(-dr/400) + 1)          expected score for home team
    dr  = (R_home + HOME_ADV) - R_away    rating difference incl. home advantage
    W   = 1 (win) / 0.5 (draw) / 0 (loss) actual result for home team
    G   = goal-difference weight (bigger wins move ratings more)
    K   = importance weight of the competition

All matches played at a neutral venue get HOME_ADV = 0.
"""
from __future__ import annotations
import csv
import math
from dataclasses import dataclass, field
from datetime import date
from typing import Dict, Iterable, List, Optional

DEFAULT_START_RATING = 1500.0

# Tournament importance weights (K factor), tunable.
DEFAULT_K = {
    "friendly": 20.0,
    "qualifier": 30.0,
    "continental": 40.0,
    "continental_final": 50.0,
    "world_cup_qualifier": 35.0,
    "world_cup_final": 60.0,
}

WORLD_CUP_FINALS = "FIFA World Cup"


def classify_tournament(name: str) -> str:
    n = name.lower()
    if n == "fifa world cup":
        return "world_cup_final"
    if "world cup qualification" in n:
        return "world_cup_qualifier"
    if n in {"fifa confederations cup"}:
        return "continental_final"
    if any(x in n for x in [
        "euro", "copa américa", "copa america", "african cup of nations",
        "afc asian cup", "gold cup", "concacaf championship",
        "oceania nations cup", "nations league",
    ]) and "qualification" not in n:
        return "continental_final"
    if "qualification" in n:
        return "qualifier"
    if n == "friendly":
        return "friendly"
    return "friendly"


def goal_weight(goal_diff: int) -> float:
    gd = abs(goal_diff)
    if gd <= 1:
        return 1.0
    if gd == 2:
        return 1.5
    return (11.0 + gd) / 8.0


@dataclass
class Match:
    date: date
    home: str
    away: str
    home_score: int
    away_score: int
    tournament: str
    neutral: bool


def load_matches(csv_path: str) -> List[Match]:
    matches: List[Match] = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                y, m, d = (int(x) for x in row["date"].split("-"))
                dt = date(y, m, d)
            except Exception:
                continue
            try:
                hs = int(row["home_score"])
                as_ = int(row["away_score"])
            except (ValueError, TypeError):
                continue
            matches.append(Match(
                date=dt,
                home=row["home_team"],
                away=row["away_team"],
                home_score=hs,
                away_score=as_,
                tournament=row["tournament"],
                neutral=row.get("neutral", "FALSE").strip().upper() == "TRUE",
            ))
    matches.sort(key=lambda mm: mm.date)
    return matches


class EloEngine:
    def __init__(self, home_adv: float = 100.0, k_weights: Optional[Dict[str, float]] = None,
                 start_rating: float = DEFAULT_START_RATING, carry_over: float = 1.0):
        self.home_adv = home_adv
        self.k_weights = k_weights or DEFAULT_K
        self.start_rating = start_rating
        self.carry_over = carry_over  # fraction of rating retained across calendar years (soft decay to mean)
        self.ratings: Dict[str, float] = {}
        self._last_year: Dict[str, int] = {}

    def get(self, team: str) -> float:
        return self.ratings.get(team, self.start_rating)

    def _maybe_decay(self, team: str, year: int) -> None:
        if self.carry_over >= 1.0:
            return
        last = self._last_year.get(team)
        if last is not None and year > last:
            r = self.get(team)
            self.ratings[team] = self.start_rating + self.carry_over * (r - self.start_rating)
        self._last_year[team] = year

    def expected(self, home: str, away: str, neutral: bool) -> float:
        adv = 0.0 if neutral else self.home_adv
        dr = (self.get(home) + adv) - self.get(away)
        return 1.0 / (10 ** (-dr / 400.0) + 1.0)

    def update(self, match: Match) -> None:
        self._maybe_decay(match.home, match.date.year)
        self._maybe_decay(match.away, match.date.year)

        we = self.expected(match.home, match.away, match.neutral)
        if match.home_score > match.away_score:
            w = 1.0
        elif match.home_score == match.away_score:
            w = 0.5
        else:
            w = 0.0

        k_type = classify_tournament(match.tournament)
        k = self.k_weights[k_type]
        g = goal_weight(match.home_score - match.away_score)

        delta = k * g * (w - we)
        self.ratings[match.home] = self.get(match.home) + delta
        self.ratings[match.away] = self.get(match.away) - delta

    def run(self, matches: Iterable[Match], up_to: Optional[date] = None) -> None:
        for m in matches:
            if up_to is not None and m.date >= up_to:
                break
            self.update(m)
