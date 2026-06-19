/**
 * index.js — Punto de entrada principal
 *
 * Modos de ejecución:
 *   node index.js              → inicia el cron y espera (modo daemon)
 *   node index.js --run-now   → ejecuta el pipeline de inmediato y termina
 *   node index.js --setup     → solo verifica la conexión WhatsApp (escanea QR)
 *
 * Pipeline completo:
 *   1. Conectar a WhatsApp Web
 *   2. Descargar mensajes del grupo objetivo
 *   3. Procesar y limpiar mensajes
 *   4. Generar resumen ejecutivo con Claude
 *   5. Calcular tendencia vs semana anterior
 *   6. Enviar email HTML
 *   7. Desconectar WhatsApp
 */

import 'dotenv/config';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

import { createClient, fetchGroupMessages, destroyClient } from './whatsapp.js';
import { processMessages, computeParticipationStats } from './processor.js';
import { generateSummary } from './summarizer.js';
import { recordAndGetTrend } from './trend.js';
import { sendSummaryEmail } from './emailer.js';

// ── Configuración desde variables de entorno ─────────────────────────────────

const CONFIG = {
  anthropicApiKey:  requireEnv('ANTHROPIC_API_KEY'),
  groupName:        requireEnv('WHATSAPP_GROUP_NAME'),
  daysBack:         parseInt(process.env.DAYS_BACK || '7', 10),
  cronSchedule:     process.env.CRON_SCHEDULE || '0 8 * * 1',
  smtp: {
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASS'),
    },
  },
  emailFrom: requireEnv('EMAIL_FROM'),
  emailTo:   requireEnv('EMAIL_TO').split(',').map((s) => s.trim()),
  sessionDir: resolveDir(process.env.SESSION_DIR || './session'),
  dataDir:    resolveDir(process.env.DATA_DIR    || './data'),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDir(p) {
  return path.isAbsolute(p) ? p : path.resolve(__dirname, p);
}

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`[Config] Variable de entorno requerida no encontrada: ${name}`);
    console.error(`[Config] Copia .env.example a .env y completa los valores.`);
    process.exit(1);
  }
  return val;
}

function log(msg) {
  const ts = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
  console.log(`[${ts}] ${msg}`);
}

// ── Pipeline principal ────────────────────────────────────────────────────────

async function runPipeline() {
  log('=== Iniciando pipeline de resumen semanal ===');
  const startTime = Date.now();

  let client;
  try {
    // 1. Conectar WhatsApp
    log('Paso 1/6 — Conectando a WhatsApp Web...');
    client = await createClient(CONFIG.sessionDir);

    // 2. Descargar mensajes
    log(`Paso 2/6 — Descargando mensajes (últimos ${CONFIG.daysBack} días)...`);
    const rawMessages = await fetchGroupMessages(client, CONFIG.groupName, CONFIG.daysBack);

    if (rawMessages.length === 0) {
      log('Sin mensajes en el período. Omitiendo generación de resumen.');
      await destroyClient(client);
      return;
    }

    // 3. Procesar mensajes
    log('Paso 3/6 — Procesando mensajes...');
    const processedData = processMessages(rawMessages);
    const stats = computeParticipationStats(processedData);
    log(`   Participantes más activos: ${stats.slice(0, 3).map((s) => `${s.author}(${s.count})`).join(', ')}`);

    // 4. Generar resumen con IA
    log('Paso 4/6 — Generando resumen ejecutivo con Claude...');
    const summary = await generateSummary(processedData, CONFIG.anthropicApiKey);

    // 5. Calcular tendencia
    log('Paso 5/6 — Calculando tendencia...');
    const trend = recordAndGetTrend({
      dataDir:       CONFIG.dataDir,
      score:         summary.scoreActividad,
      periodStart:   processedData.periodStart,
      periodEnd:     processedData.periodEnd,
      totalMessages: processedData.totalMessages,
      participants:  processedData.uniqueParticipants,
    });
    log(`   Tendencia: ${trend.arrow} ${trend.direction} (${trend.label})`);

    // 6. Enviar email
    log('Paso 6/6 — Enviando email...');
    await sendSummaryEmail({
      smtpConfig: CONFIG.smtp,
      from:       CONFIG.emailFrom,
      to:         CONFIG.emailTo,
      data:       processedData,
      summary,
      trend,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`=== Pipeline completado en ${elapsed}s ===`);

  } catch (err) {
    log(`ERROR en el pipeline: ${err.message}`);
    console.error(err);
    throw err;
  } finally {
    if (client) {
      await destroyClient(client);
    }
  }
}

// ── Modo setup (solo verificar QR) ───────────────────────────────────────────

async function runSetup() {
  log('=== Modo setup: verificando conexión WhatsApp ===');
  log('Escanea el QR cuando aparezca. La sesión quedará guardada para futuras ejecuciones.');
  const client = await createClient(CONFIG.sessionDir);
  log('Conexión exitosa. Sesión guardada en: ' + CONFIG.sessionDir);
  log('Puedes cerrar este proceso ahora (Ctrl+C).');
  // Mantener vivo para que el usuario vea el resultado
  process.on('SIGINT', async () => {
    await destroyClient(client);
    process.exit(0);
  });
}

// ── Modo cron (daemon) ────────────────────────────────────────────────────────

function startCron() {
  if (!cron.validate(CONFIG.cronSchedule)) {
    console.error(`[Cron] Expresión cron inválida: "${CONFIG.cronSchedule}"`);
    process.exit(1);
  }

  log(`=== Modo daemon iniciado ===`);
  log(`Cron programado: "${CONFIG.cronSchedule}"`);
  log(`Grupo: "${CONFIG.groupName}"`);
  log(`Destinatarios: ${CONFIG.emailTo.join(', ')}`);
  log('Esperando próxima ejecución...\n');

  cron.schedule(CONFIG.cronSchedule, async () => {
    try {
      await runPipeline();
    } catch (err) {
      log(`Pipeline falló: ${err.message}`);
    }
  }, {
    timezone: 'America/Guayaquil',
  });

  // Mantener el proceso vivo
  process.on('SIGINT', () => {
    log('Señal SIGINT recibida. Cerrando...');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    log('Señal SIGTERM recibida. Cerrando...');
    process.exit(0);
  });
}

// ── Punto de entrada ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--setup')) {
  runSetup().catch((err) => {
    console.error('[Setup] Error:', err.message);
    process.exit(1);
  });
} else if (args.includes('--run-now')) {
  runPipeline()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Pipeline] Error fatal:', err.message);
      process.exit(1);
    });
} else {
  startCron();
}
