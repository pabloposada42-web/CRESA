/**
 * processor.js
 * Toma los mensajes crudos de WhatsApp y los convierte en un objeto
 * estructurado listo para enviar al modelo de IA.
 */

/**
 * @typedef {Object} ProcessedData
 * @property {string}   periodStart     ISO date del primer mensaje
 * @property {string}   periodEnd       ISO date del último mensaje
 * @property {number}   totalMessages   Total de mensajes del periodo
 * @property {number}   uniqueParticipants Número de personas distintas
 * @property {string[]} participants    Lista de nombres de participantes
 * @property {string}   transcript      Texto completo ordenado cronológicamente
 * @property {MessageEntry[]} messages  Array estructurado de mensajes
 */

/**
 * @typedef {Object} MessageEntry
 * @property {string} timestamp  ISO string
 * @property {string} author     Nombre o número del autor
 * @property {string} body       Texto del mensaje
 */

/**
 * Formatea una fecha como "dd/mm/yyyy HH:MM".
 * @param {Date} d
 */
function fmtDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/**
 * Extrae el nombre visible de un contacto a partir del objeto de mensaje.
 * Prefiere el nombre guardado en la agenda; si no, usa el número.
 *
 * @param {import('whatsapp-web.js').Message} msg
 * @returns {string}
 */
function resolveAuthor(msg) {
  if (msg._data?.notifyName) return msg._data.notifyName;
  if (msg.author) return msg.author.replace('@c.us', '');
  if (msg.from) return msg.from.replace('@c.us', '');
  return 'Desconocido';
}

/**
 * Limpia el cuerpo del mensaje: elimina caracteres de control,
 * normaliza espacios y trunca líneas excesivamente largas.
 *
 * @param {string} body
 * @returns {string}
 */
function cleanBody(body) {
  return body
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .replace(/\r\n|\r/g, '\n')                            // normalize newlines
    .replace(/[ \t]+/g, ' ')                              // collapse spaces
    .trim()
    .slice(0, 2000);                                      // cap individual message length
}

/**
 * Convierte los mensajes crudos de whatsapp-web.js en el objeto ProcessedData.
 *
 * @param {import('whatsapp-web.js').Message[]} rawMessages
 * @returns {ProcessedData}
 */
export function processMessages(rawMessages) {
  if (rawMessages.length === 0) {
    const now = new Date().toISOString();
    return {
      periodStart: now,
      periodEnd: now,
      totalMessages: 0,
      uniqueParticipants: 0,
      participants: [],
      transcript: '(Sin mensajes en el período)',
      messages: [],
    };
  }

  const messages = rawMessages.map((msg) => ({
    timestamp: new Date(msg.timestamp * 1000).toISOString(),
    author: resolveAuthor(msg),
    body: cleanBody(msg.body || ''),
  }));

  // Deduplicar autores
  const participantSet = new Set(messages.map((m) => m.author));
  const participants = [...participantSet].sort();

  // Construir transcript legible
  const lines = messages.map(
    (m) => `[${fmtDate(new Date(m.timestamp))}] ${m.author}: ${m.body}`
  );
  const transcript = lines.join('\n');

  return {
    periodStart: messages[0].timestamp,
    periodEnd: messages[messages.length - 1].timestamp,
    totalMessages: messages.length,
    uniqueParticipants: participants.length,
    participants,
    transcript,
    messages,
  };
}

/**
 * Genera estadísticas rápidas de actividad por autor (mensajes por persona).
 *
 * @param {ProcessedData} data
 * @returns {{ author: string, count: number }[]}  Ordenado de mayor a menor.
 */
export function computeParticipationStats(data) {
  const counts = {};
  for (const m of data.messages) {
    counts[m.author] = (counts[m.author] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count);
}
