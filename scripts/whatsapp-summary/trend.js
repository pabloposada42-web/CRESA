/**
 * trend.js
 * Persiste el historial semanal de scores en un JSON local y calcula
 * el indicador de tendencia (subiendo / estable / bajando) respecto
 * a la semana anterior.
 */

import fs from 'fs';
import path from 'path';

/**
 * @typedef {Object} WeekRecord
 * @property {string} weekId        Identificador ISO de semana, ej. "2025-W18"
 * @property {string} periodStart   ISO date inicio del período
 * @property {string} periodEnd     ISO date fin del período
 * @property {number} score         Score 0–100
 * @property {number} totalMessages Total de mensajes del período
 * @property {number} participants  Participantes únicos
 * @property {string} generatedAt   ISO timestamp de cuándo se generó
 */

/**
 * @typedef {Object} TrendResult
 * @property {'subiendo'|'estable'|'bajando'} direction
 * @property {string}  arrow          '↑' | '→' | '↓'
 * @property {string}  color          Color hex para el email
 * @property {number}  currentScore
 * @property {number|null} previousScore
 * @property {number|null} delta       Diferencia absoluta (currentScore - previousScore)
 * @property {string}  label          Texto legible, ej. "+12 puntos vs semana anterior"
 * @property {WeekRecord[]} history   Últimas 8 semanas para el gráfico
 */

const STABLE_THRESHOLD = 5; // Diferencia menor a este valor = "estable"

/**
 * Calcula el identificador de semana ISO para una fecha dada.
 * Formato: "YYYY-Www"
 *
 * @param {Date} date
 * @returns {string}
 */
export function getWeekId(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Carga el historial desde disco. Si no existe, retorna array vacío.
 *
 * @param {string} dataDir
 * @returns {WeekRecord[]}
 */
function loadHistory(dataDir) {
  const filePath = path.join(dataDir, 'history.json');
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Guarda el historial en disco.
 *
 * @param {string} dataDir
 * @param {WeekRecord[]} history
 */
function saveHistory(dataDir, history) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, 'history.json');
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * Registra la semana actual en el historial y calcula la tendencia.
 *
 * @param {object} params
 * @param {string} params.dataDir
 * @param {number} params.score
 * @param {string} params.periodStart
 * @param {string} params.periodEnd
 * @param {number} params.totalMessages
 * @param {number} params.participants
 * @returns {TrendResult}
 */
export function recordAndGetTrend({ dataDir, score, periodStart, periodEnd, totalMessages, participants }) {
  const history = loadHistory(dataDir);
  const weekId = getWeekId(new Date(periodEnd));

  // Si ya existe un registro para esta semana, actualízalo
  const existingIdx = history.findIndex((r) => r.weekId === weekId);
  const newRecord = {
    weekId,
    periodStart,
    periodEnd,
    score,
    totalMessages,
    participants,
    generatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    history[existingIdx] = newRecord;
  } else {
    history.push(newRecord);
  }

  // Ordenar cronológicamente y conservar máximo 52 semanas
  history.sort((a, b) => a.weekId.localeCompare(b.weekId));
  if (history.length > 52) history.splice(0, history.length - 52);

  saveHistory(dataDir, history);

  // Calcular tendencia vs semana anterior
  const currentIdx = history.findIndex((r) => r.weekId === weekId);
  const previous = currentIdx > 0 ? history[currentIdx - 1] : null;
  const previousScore = previous ? previous.score : null;
  const delta = previousScore !== null ? score - previousScore : null;

  let direction, arrow, color, label;

  if (delta === null) {
    direction = 'estable';
    arrow = '→';
    color = '#6B7280';
    label = 'Primera semana registrada';
  } else if (Math.abs(delta) < STABLE_THRESHOLD) {
    direction = 'estable';
    arrow = '→';
    color = '#6B7280';
    label = `Sin cambio significativo (${delta >= 0 ? '+' : ''}${delta} pts vs semana anterior)`;
  } else if (delta > 0) {
    direction = 'subiendo';
    arrow = '↑';
    color = '#16A34A';
    label = `+${delta} puntos vs semana anterior`;
  } else {
    direction = 'bajando';
    arrow = '↓';
    color = '#DC2626';
    label = `${delta} puntos vs semana anterior`;
  }

  return {
    direction,
    arrow,
    color,
    currentScore: score,
    previousScore,
    delta,
    label,
    history: history.slice(-8), // últimas 8 semanas para el gráfico ASCII del email
  };
}

/**
 * Genera una pequeña visualización ASCII del historial de scores
 * para incluir en el email en texto plano.
 *
 * @param {WeekRecord[]} history  Últimas N semanas.
 * @returns {string}
 */
export function buildAsciiChart(history) {
  if (history.length === 0) return '';
  const maxScore = 100;
  const height = 5;
  const bars = history.map((r) => {
    const filled = Math.round((r.score / maxScore) * height);
    return { weekId: r.weekId.replace(/.*-/, ''), filled, score: r.score };
  });

  const rows = [];
  for (let row = height; row >= 1; row--) {
    const line = bars.map((b) => (b.filled >= row ? '█' : '░')).join(' ');
    rows.push(line);
  }
  rows.push(bars.map((b) => b.weekId).join(' '));
  rows.push(bars.map((b) => String(b.score).padEnd(b.weekId.length)).join(' '));
  return rows.join('\n');
}
