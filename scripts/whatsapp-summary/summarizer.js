/**
 * summarizer.js
 * Envía la conversación procesada a Claude (Anthropic) y obtiene:
 *   - Resumen ejecutivo narrativo
 *   - Temas principales (array)
 *   - Acciones pendientes (array)
 *   - Alertas / urgencias (array)
 *   - Score de actividad operativa 0–100
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * @typedef {Object} Summary
 * @property {string}   resumenEjecutivo   Párrafo de 150–200 palabras
 * @property {string[]} temasPrincipales   5–8 temas identificados
 * @property {string[]} accionesPendientes Lista de acciones/tareas mencionadas
 * @property {string[]} alertas            Problemas urgentes o críticos detectados
 * @property {number}   scoreActividad     Entero 0–100
 * @property {string}   justificacionScore Breve explicación del score
 */

const SYSTEM_PROMPT = `Eres un asistente ejecutivo experto en análisis de comunicaciones operativas.
Tu tarea es analizar la conversación de un grupo de WhatsApp de operaciones y producir un reporte estructurado en español.

El reporte debe contener EXACTAMENTE este JSON (sin texto extra antes ni después):

{
  "resumenEjecutivo": "<párrafo de 150 a 200 palabras que describa el estado operativo de la semana, logros, problemas y contexto general>",
  "temasPrincipales": [
    "<tema 1 en 1 línea>",
    "<tema 2 en 1 línea>",
    ...
  ],
  "accionesPendientes": [
    "<acción o tarea mencionada — quién, qué, cuándo si se especificó>",
    ...
  ],
  "alertas": [
    "<problema urgente, incidente o riesgo detectado>",
    ...
  ],
  "scoreActividad": <entero entre 0 y 100>,
  "justificacionScore": "<1–2 oraciones que explican el score>"
}

Criterios para el scoreActividad (0–100):
- Volumen de mensajes y participantes activos     (0–25 puntos)
- Diversidad y relevancia de los temas tratados   (0–25 puntos)
- Cantidad de acciones concretas generadas         (0–25 puntos)
- Urgencia y criticidad de los temas (más urgencia = score más alto)  (0–25 puntos)

Un score alto (>70) indica una semana con alta actividad operativa o muchos temas críticos.
Un score bajo (<30) indica una semana tranquila con pocos temas o participación baja.

Si no hay mensajes, devuelve scores y arrays vacíos con resumen indicando ausencia de actividad.`;

/**
 * Genera el resumen ejecutivo de la semana usando Claude.
 *
 * @param {import('./processor.js').ProcessedData} processedData
 * @param {string} apiKey  Clave de Anthropic.
 * @returns {Promise<Summary>}
 */
export async function generateSummary(processedData, apiKey) {
  const client = new Anthropic({ apiKey });

  const userContent = buildUserMessage(processedData);

  console.log('[Summarizer] Enviando conversación a Claude para análisis...');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const rawText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const summary = parseResponse(rawText);
  console.log(`[Summarizer] Análisis completo. Score de actividad: ${summary.scoreActividad}/100`);
  return summary;
}

/**
 * Construye el mensaje de usuario con estadísticas y transcript.
 *
 * @param {import('./processor.js').ProcessedData} data
 * @returns {string}
 */
function buildUserMessage(data) {
  const startStr = new Date(data.periodStart).toLocaleDateString('es-EC', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const endStr = new Date(data.periodEnd).toLocaleDateString('es-EC', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return [
    `PERÍODO: ${startStr} al ${endStr}`,
    `TOTAL MENSAJES: ${data.totalMessages}`,
    `PARTICIPANTES ÚNICOS: ${data.uniqueParticipants} (${data.participants.join(', ')})`,
    '',
    '--- CONVERSACIÓN ---',
    data.transcript || '(Sin mensajes)',
    '--- FIN CONVERSACIÓN ---',
  ].join('\n');
}

/**
 * Parsea el JSON devuelto por Claude. Aplica fallback si el JSON viene
 * envuelto en bloques de código markdown.
 *
 * @param {string} raw
 * @returns {Summary}
 */
function parseResponse(raw) {
  // Extraer JSON de bloque ```json ... ``` si existe
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : raw;

  try {
    const parsed = JSON.parse(jsonStr.trim());
    return {
      resumenEjecutivo: String(parsed.resumenEjecutivo || ''),
      temasPrincipales: toStringArray(parsed.temasPrincipales),
      accionesPendientes: toStringArray(parsed.accionesPendientes),
      alertas: toStringArray(parsed.alertas),
      scoreActividad: clampScore(parsed.scoreActividad),
      justificacionScore: String(parsed.justificacionScore || ''),
    };
  } catch (err) {
    console.error('[Summarizer] Error parseando respuesta de Claude:', err.message);
    console.error('[Summarizer] Respuesta raw:', raw.slice(0, 500));
    return {
      resumenEjecutivo: 'No se pudo generar el resumen automáticamente. Revisar logs.',
      temasPrincipales: [],
      accionesPendientes: [],
      alertas: ['Error al procesar la respuesta del modelo de IA.'],
      scoreActividad: 0,
      justificacionScore: 'Error de procesamiento.',
    };
  }
}

function toStringArray(val) {
  if (!Array.isArray(val)) return [];
  return val.map(String).filter((s) => s.trim().length > 0);
}

function clampScore(val) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
