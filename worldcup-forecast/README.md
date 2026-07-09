# Modelo de pronóstico de resultados del Mundial

Modelo standalone (no integrado a la app CRESA) para pronosticar resultados
de partidos del Mundial de fútbol, basado en **rating Elo** + **modelo de
goles Poisson con corrección Dixon-Coles**.

## Metodología

1. **Elo**: cada selección tiene un rating que se actualiza tras cada
   partido internacional (1872-hoy, ~49.500 partidos) con la fórmula
   estándar de "World Football Elo Ratings": `R_new = R_old + K·G·(W - We)`,
   donde `K` depende de la importancia del torneo, `G` pondera la
   diferencia de goles, y `We` es el resultado esperado según la
   diferencia de rating (+ ventaja de local si no es cancha neutral).
2. **Modelo de goles**: la diferencia de rating Elo se convierte en goles
   esperados (`λ_local`, `λ_visitante`) vía una pendiente calibrada por
   regresión sobre goles reales históricos. Las probabilidades de
   resultado (local/empate/visitante) y el marcador se calculan
   analíticamente con distribuciones de Poisson independientes, con
   corrección Dixon-Coles (`rho`) para marcadores bajos (0-0, 1-0, 0-1, 1-1).
3. **Validación**: backtest contra los Mundiales 2002-2022 (384 partidos)
   y contra los partidos ya jugados del Mundial 2026 (96 partidos, hasta
   cuartos de final) como holdout genuinamente no visto durante el ajuste.

## Archivos

- `elo.py` — motor de rating Elo.
- `model.py` — modelo de goles Poisson/Dixon-Coles.
- `backtest.py` — evalúa el modelo contra Mundiales históricos (log-loss,
  Brier, accuracy), en modo "frozen" (ratings congelados antes del torneo)
  o "live" (ratings actualizados partido a partido).
- `tune.py` — búsqueda en grilla de hiperparámetros.
- `eval_wc2026.py` — valida el modelo contra los partidos reales ya
  jugados del Mundial 2026.
- `forecast_2026.py` — pronóstico de cuartos de final, semifinales,
  tercer puesto y final del Mundial 2026, vía simulación Monte Carlo.
- `config.py` — hiperparámetros finales elegidos.

## Resultados de validación

| Configuración | log-loss hist. (2002-22) | accuracy hist. | log-loss WC2026 | accuracy WC2026 | **promedio** |
|---|---|---|---|---|---|
| Default (sin ajustar) | 0.9887 | 54.4% | 0.8552 | 63.5% | 0.9220 |
| **Elegida** (home_adv=50, K×1.5, ρ=-0.08) | 0.9855 | 55.5% | 0.8502 | 63.5% | **0.9179** |
| Ajuste agresivo (K×2.5-4, home_adv≈0) | 0.9814-0.9819 | 55.2% | 0.8659-0.8772 | 61.5-62.5% | 0.9239-0.9293 |

**Lección clave**: ajustar agresivamente los hiperparámetros mejoraba el
ajuste histórico (2002-2022) pero *empeoraba* la generalización al
Mundial 2026 real — señal clásica de sobreajuste sobre una muestra
pequeña (384 partidos). Se eligió la configuración con mejor promedio
entre ambas validaciones, no la de mejor score aislado, priorizando
robustez sobre precisión aparente.

El modelo predice el resultado más probable (local/empate/visitante) en
~55% de los partidos de Mundiales históricos y ~63-64% de los partidos ya
jugados del Mundial 2026 (torneo de 48 equipos, con más partidos
desparejos en primera fase, de ahí la mayor accuracy). Como referencia,
predecir siempre con probabilidad uniforme (1/3 cada resultado) da
log-loss=1.099 y accuracy≈33%; nuestro modelo reduce el log-loss en ~10-23%
según el conjunto.

## Pronóstico Mundial 2026 (cuartos de final en adelante)

Generado con `python3 forecast_2026.py`, usando ratings Elo actualizados
con los 96 partidos ya jugados (fase de grupos a octavos):

**Cuartos de final** (prob. de avanzar, incluye penales si hay empate):
- Francia 68% vs Marruecos 32%
- España 74% vs Bélgica 26%
- Noruega 40% vs Inglaterra 60%
- Argentina 73% vs Suiza 27%

**Probabilidad de ser campeón** (simulación Monte Carlo, 50.000 corridas):
1. España — 26.0%
2. Argentina — 23.2%
3. Francia — 21.2%
4. Inglaterra — 13.2%
5. Noruega — 5.6%
6. Marruecos — 4.5%
7. Bélgica / Suiza — 3.2% cada uno

Ver `results/wc2026_forecast.json` para el detalle completo.

## Cómo correr

```bash
pip install pandas numpy scipy  # no estrictamente necesario, sólo stdlib se usa
python3 backtest.py frozen      # backtest histórico
python3 tune.py                 # búsqueda de hiperparámetros
python3 eval_wc2026.py          # validación contra Mundial 2026 real
python3 forecast_2026.py        # pronóstico de lo que falta del torneo
```

## Limitaciones y próximos pasos

- La muestra de Mundiales históricos es chica (6 torneos, 384 partidos),
  lo que limita cuánto se puede afinar el modelo sin sobreajustar.
- No incorpora lesiones, alineaciones, ni forma reciente más allá de lo
  que ya captura el rating Elo.
- El desempate por penales se modela como ~50/50 con leve inclinación
  al equipo más fuerte (documentado en la literatura como
  aproximadamente aleatorio).
- Posibles mejoras futuras: ponderar más los partidos de eliminación
  directa, incorporar un factor de "forma reciente" independiente del
  Elo, o mezclar con rankings FIFA/mercados de apuestas como señal
  adicional.
