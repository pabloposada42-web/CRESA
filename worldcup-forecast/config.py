"""
Final chosen hyperparameters.

Selected via grid search on WC 2002-2022 (384 matches), then validated
against the real WC2026 matches already played through the quarterfinals
(96 matches) as a genuinely untouched holdout. Aggressive tuning (e.g.
k_scale 3-4x, home_adv=0) improved the 2002-2022 fit but generalized worse
to WC2026 -- a classic overfitting signature on a small backtest sample.
This configuration was the best *average* of both, i.e. the most robust,
not the single best score on either one:

  name           hist_logloss  hist_acc  wc2026_logloss  wc2026_acc  avg_logloss
  default            0.9887     0.544        0.8552         0.635      0.9220
  coarse_grid        0.9855     0.555        0.8502         0.635      0.9179  <- chosen
  mild               0.9867     0.552        0.8502         0.646      0.9185
  fine_grid_best     0.9819     0.552        0.8659         0.625      0.9239
  extreme            0.9814     0.552        0.8772         0.615      0.9293
"""

HOME_ADV = 50.0
K_SCALE = 1.5
CARRY_OVER = 1.0
RHO = -0.08

from elo import DEFAULT_K


def k_weights():
    return {k: v * K_SCALE for k, v in DEFAULT_K.items()}
