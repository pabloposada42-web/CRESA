/**
 * whatsapp.js
 * Gestiona la conexión a WhatsApp Web y la descarga de mensajes del grupo objetivo.
 * Usa whatsapp-web.js (Puppeteer headless) con sesión persistente para evitar
 * escanear el QR en cada ejecución.
 */

import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';

const { Client, LocalAuth } = pkg;

/**
 * Crea e inicializa el cliente de WhatsApp.
 * En el primer arranque muestra el QR en la terminal.
 * Las sesiones posteriores se autentican automáticamente.
 *
 * @param {string} sessionDir  Ruta donde se guarda la sesión local.
 * @returns {Promise<Client>}  Cliente autenticado y listo.
 */
export async function createClient(sessionDir) {
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionDir }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', (qr) => {
    console.log('\n[WhatsApp] Escanea el siguiente QR con tu teléfono:');
    qrcode.generate(qr, { small: true });
    console.log('[WhatsApp] Esperando autenticación...\n');
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Sesión autenticada correctamente.');
  });

  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Error de autenticación:', msg);
    throw new Error(`WhatsApp auth_failure: ${msg}`);
  });

  client.on('disconnected', (reason) => {
    console.warn('[WhatsApp] Cliente desconectado:', reason);
  });

  await new Promise((resolve, reject) => {
    client.on('ready', resolve);
    client.on('auth_failure', reject);
    client.initialize().catch(reject);
  });

  console.log('[WhatsApp] Cliente listo.');
  return client;
}

/**
 * Busca el chat del grupo por nombre exacto.
 *
 * @param {Client} client
 * @param {string} groupName  Nombre del grupo (debe coincidir exactamente).
 * @returns {Promise<import('whatsapp-web.js').Chat>}
 */
async function findGroupChat(client, groupName) {
  const chats = await client.getChats();
  const chat = chats.find(
    (c) => c.isGroup && c.name === groupName
  );
  if (!chat) {
    const available = chats.filter((c) => c.isGroup).map((c) => c.name);
    throw new Error(
      `Grupo "${groupName}" no encontrado.\n` +
      `Grupos disponibles:\n  - ${available.join('\n  - ')}`
    );
  }
  return chat;
}

/**
 * Descarga los mensajes del grupo de los últimos `daysBack` días.
 *
 * @param {Client} client
 * @param {string} groupName
 * @param {number} daysBack
 * @returns {Promise<RawMessage[]>}
 */
export async function fetchGroupMessages(client, groupName, daysBack) {
  console.log(`[WhatsApp] Buscando grupo: "${groupName}"...`);
  const chat = await findGroupChat(client, groupName);
  console.log(`[WhatsApp] Grupo encontrado. Descargando mensajes...`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  cutoffDate.setHours(0, 0, 0, 0);

  const raw = [];
  let fetchedMessages = await chat.fetchMessages({ limit: 100 });
  raw.push(...fetchedMessages);

  // Paginar hacia atrás mientras el mensaje más antiguo sea posterior al corte
  while (fetchedMessages.length > 0) {
    const oldest = fetchedMessages[0];
    const oldestDate = new Date(oldest.timestamp * 1000);
    if (oldestDate <= cutoffDate) break;

    fetchedMessages = await chat.fetchMessages({
      limit: 100,
      before: oldest.id._serialized,
    });
    raw.push(...fetchedMessages);
  }

  // Filtrar al rango exacto y excluir mensajes del sistema
  const filtered = raw.filter((msg) => {
    const msgDate = new Date(msg.timestamp * 1000);
    return (
      msgDate >= cutoffDate &&
      msg.type === 'chat' &&
      msg.body &&
      msg.body.trim().length > 0
    );
  });

  // Deduplicar por ID
  const seen = new Set();
  const unique = filtered.filter((msg) => {
    const key = msg.id._serialized;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ordenar cronológicamente
  unique.sort((a, b) => a.timestamp - b.timestamp);

  console.log(`[WhatsApp] ${unique.length} mensajes descargados (últimos ${daysBack} días).`);
  return unique;
}

/**
 * Cierra el cliente de WhatsApp limpiamente.
 *
 * @param {Client} client
 */
export async function destroyClient(client) {
  try {
    await client.destroy();
    console.log('[WhatsApp] Cliente cerrado.');
  } catch (e) {
    // Ignorar errores al cerrar
  }
}
