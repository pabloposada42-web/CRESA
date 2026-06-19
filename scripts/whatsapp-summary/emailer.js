/**
 * emailer.js
 * Construye el email HTML del resumen semanal y lo envía por SMTP.
 * El email incluye: período, indicador de tendencia, resumen ejecutivo,
 * temas, acciones pendientes, alertas y mini-gráfico de historial.
 */

import nodemailer from 'nodemailer';
import { buildAsciiChart } from './trend.js';

/**
 * @param {import('nodemailer').TransportOptions} smtpConfig
 * @returns {import('nodemailer').Transporter}
 */
function createTransport(smtpConfig) {
  return nodemailer.createTransport(smtpConfig);
}

/**
 * Formatea una fecha ISO como "lunes, 28 de abril de 2025".
 * @param {string} isoDate
 */
function fmtFull(isoDate) {
  return new Date(isoDate).toLocaleDateString('es-EC', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

/**
 * Construye el HTML completo del email.
 *
 * @param {object} p
 * @param {import('./processor.js').ProcessedData} p.data
 * @param {import('./summarizer.js').Summary}      p.summary
 * @param {import('./trend.js').TrendResult}        p.trend
 * @returns {string} HTML
 */
function buildHtml({ data, summary, trend }) {
  const periodStart = fmtFull(data.periodStart);
  const periodEnd   = fmtFull(data.periodEnd);

  const trendBg    = trend.direction === 'subiendo' ? '#DCFCE7'
                   : trend.direction === 'bajando'  ? '#FEE2E2'
                   :                                  '#F3F4F6';
  const trendBorder = trend.color;

  const renderList = (items, emptyMsg = 'Ninguna identificada.') => {
    if (!items || items.length === 0) {
      return `<li style="color:#6B7280;">${emptyMsg}</li>`;
    }
    return items.map((i) => `<li>${escHtml(i)}</li>`).join('\n');
  };

  const scoreBar = Math.max(0, Math.min(100, summary.scoreActividad));
  const barColor = scoreBar >= 70 ? '#DC2626'
                 : scoreBar >= 40 ? '#F59E0B'
                 :                  '#16A34A';

  const historyRows = trend.history.length > 0
    ? trend.history.map((r) => `
        <td style="text-align:center; padding:4px 8px; font-size:12px; color:#374151;">
          <div style="margin-bottom:4px; font-weight:bold; color:${scoreColor(r.score)};">${r.score}</div>
          <div style="font-size:10px; color:#9CA3AF;">${r.weekId.replace(/.*-/, '')}</div>
        </td>`).join('')
    : '<td colspan="8" style="text-align:center;color:#9CA3AF;">Sin historial previo</td>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Resumen Semanal Operativo — Team AORA</title>
</head>
<body style="margin:0; padding:0; background:#F9FAFB; font-family:'Segoe UI',Arial,sans-serif; color:#111827;">

  <!-- WRAPPER -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F9FAFB; padding:32px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px; width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:#1E3A5F; border-radius:12px 12px 0 0; padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="color:#93C5FD; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">
                    Novedades Operativas
                  </div>
                  <div style="color:#FFFFFF; font-size:22px; font-weight:700; line-height:1.3;">
                    Team AORA – LA GARANTÍA
                  </div>
                  <div style="color:#BFDBFE; font-size:13px; margin-top:6px;">
                    ${periodStart} &nbsp;→&nbsp; ${periodEnd}
                  </div>
                </td>
                <td align="right" style="vertical-align:top;">
                  <div style="background:#2563EB; border-radius:8px; padding:10px 16px; text-align:center;">
                    <div style="color:#BFDBFE; font-size:10px; text-transform:uppercase; letter-spacing:1px;">Mensajes</div>
                    <div style="color:#FFFFFF; font-size:28px; font-weight:800;">${data.totalMessages}</div>
                    <div style="color:#BFDBFE; font-size:10px;">${data.uniqueParticipants} participantes</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- INDICADOR DE TENDENCIA -->
        <tr>
          <td style="background:${trendBg}; border-left:4px solid ${trendBorder}; border-right:4px solid ${trendBorder}; padding:16px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:36px; line-height:1; color:${trend.color}; font-weight:800;">${trend.arrow}</span>
                  &nbsp;
                  <span style="font-size:16px; font-weight:700; color:${trend.color}; text-transform:uppercase;">
                    Actividad ${trend.direction}
                  </span>
                  <div style="color:#374151; font-size:13px; margin-top:4px;">${escHtml(trend.label)}</div>
                </td>
                <td align="right" style="vertical-align:middle; white-space:nowrap;">
                  <div style="font-size:11px; color:#6B7280; margin-bottom:4px;">Score Operativo</div>
                  <div style="font-size:38px; font-weight:800; color:${barColor}; line-height:1;">${scoreBar}</div>
                  <div style="font-size:11px; color:#6B7280;">/100</div>
                </td>
              </tr>
            </table>
            <!-- Barra de progreso -->
            <div style="margin-top:12px; background:#E5E7EB; border-radius:999px; height:8px; overflow:hidden;">
              <div style="width:${scoreBar}%; background:${barColor}; height:8px; border-radius:999px;"></div>
            </div>
            <div style="font-size:11px; color:#6B7280; margin-top:6px; font-style:italic;">
              ${escHtml(summary.justificacionScore)}
            </div>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#FFFFFF; border-left:4px solid ${trendBorder}; border-right:4px solid ${trendBorder}; padding:28px 32px;">

            <!-- Resumen ejecutivo -->
            <h2 style="margin:0 0 12px; font-size:15px; text-transform:uppercase; letter-spacing:.5px; color:#1E3A5F; border-bottom:2px solid #E5E7EB; padding-bottom:8px;">
              Resumen Ejecutivo
            </h2>
            <p style="margin:0 0 24px; font-size:14px; line-height:1.7; color:#374151;">
              ${escHtml(summary.resumenEjecutivo).replace(/\n/g, '<br/>')}
            </p>

            <!-- Temas principales -->
            <h2 style="margin:0 0 12px; font-size:15px; text-transform:uppercase; letter-spacing:.5px; color:#1E3A5F; border-bottom:2px solid #E5E7EB; padding-bottom:8px;">
              Temas Principales
            </h2>
            <ul style="margin:0 0 24px; padding-left:20px; font-size:14px; line-height:1.8; color:#374151;">
              ${renderList(summary.temasPrincipales, 'Sin temas identificados.')}
            </ul>

            <!-- Acciones pendientes -->
            <h2 style="margin:0 0 12px; font-size:15px; text-transform:uppercase; letter-spacing:.5px; color:#1E3A5F; border-bottom:2px solid #E5E7EB; padding-bottom:8px;">
              Acciones Pendientes
            </h2>
            <ul style="margin:0 0 24px; padding-left:20px; font-size:14px; line-height:1.8; color:#374151;">
              ${renderList(summary.accionesPendientes, 'Ninguna acción identificada.')}
            </ul>

            <!-- Alertas -->
            ${summary.alertas && summary.alertas.length > 0 ? `
            <h2 style="margin:0 0 12px; font-size:15px; text-transform:uppercase; letter-spacing:.5px; color:#DC2626; border-bottom:2px solid #FEE2E2; padding-bottom:8px;">
              ⚠ Alertas / Urgencias
            </h2>
            <div style="background:#FEF2F2; border-left:4px solid #DC2626; border-radius:0 6px 6px 0; padding:14px 16px; margin-bottom:24px;">
              <ul style="margin:0; padding-left:20px; font-size:14px; line-height:1.8; color:#991B1B;">
                ${renderList(summary.alertas)}
              </ul>
            </div>` : ''}

            <!-- Historial de scores -->
            <h2 style="margin:0 0 12px; font-size:15px; text-transform:uppercase; letter-spacing:.5px; color:#1E3A5F; border-bottom:2px solid #E5E7EB; padding-bottom:8px;">
              Historial de Actividad (últimas 8 semanas)
            </h2>
            <table cellpadding="0" cellspacing="4" border="0" style="width:100%; border-collapse:separate; border-spacing:4px;">
              <tr>${historyRows}</tr>
            </table>
            <div style="font-size:11px; color:#9CA3AF; margin-top:8px; text-align:center;">
              Score operativo por semana (0 = inactivo · 100 = máxima actividad/urgencia)
            </div>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#1E3A5F; border-radius:0 0 12px 12px; padding:16px 32px; text-align:center;">
            <div style="color:#93C5FD; font-size:11px; line-height:1.6;">
              Generado automáticamente por el sistema de resumen semanal de AORA.<br/>
              Este reporte cubre la conversación del grupo <strong style="color:#BFDBFE;">Team AORA – LA GARANTÍA (Temas Operativos)</strong><br/>
              correspondiente al período ${periodStart} — ${periodEnd}.
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

/**
 * Construye la versión texto plano del email (fallback).
 */
function buildText({ data, summary, trend }) {
  const lines = [
    '====================================================',
    'RESUMEN SEMANAL — Team AORA LA GARANTÍA (Operativo)',
    '====================================================',
    `Período: ${fmtFull(data.periodStart)} → ${fmtFull(data.periodEnd)}`,
    `Mensajes: ${data.totalMessages}  |  Participantes: ${data.uniqueParticipants}`,
    '',
    `TENDENCIA: ${trend.arrow} Actividad ${trend.direction.toUpperCase()} — ${trend.label}`,
    `Score operativo: ${summary.scoreActividad}/100`,
    summary.justificacionScore,
    '',
    '--- RESUMEN EJECUTIVO ---',
    summary.resumenEjecutivo,
    '',
    '--- TEMAS PRINCIPALES ---',
    ...(summary.temasPrincipales.map((t, i) => `${i + 1}. ${t}`)),
    '',
    '--- ACCIONES PENDIENTES ---',
    ...(summary.accionesPendientes.length > 0
      ? summary.accionesPendientes.map((a, i) => `${i + 1}. ${a}`)
      : ['Ninguna.']),
    '',
    ...(summary.alertas.length > 0 ? [
      '--- ⚠ ALERTAS / URGENCIAS ---',
      ...summary.alertas.map((a, i) => `${i + 1}. ${a}`),
      '',
    ] : []),
    '--- HISTORIAL DE SCORES ---',
    buildAsciiChart(trend.history),
    '',
    '====================================================',
    'Generado automáticamente — AORA Weekly Summary',
    '====================================================',
  ];
  return lines.join('\n');
}

/** Escapa caracteres HTML peligrosos. */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Devuelve color hex según el score. */
function scoreColor(score) {
  if (score >= 70) return '#DC2626';
  if (score >= 40) return '#F59E0B';
  return '#16A34A';
}

/**
 * Envía el email de resumen semanal.
 *
 * @param {object} params
 * @param {object} params.smtpConfig    Objeto de configuración nodemailer
 * @param {string} params.from          Remitente (ej. '"AORA Ops" <ops@empresa.com>')
 * @param {string|string[]} params.to   Destinatario(s)
 * @param {import('./processor.js').ProcessedData} params.data
 * @param {import('./summarizer.js').Summary}      params.summary
 * @param {import('./trend.js').TrendResult}        params.trend
 */
export async function sendSummaryEmail({ smtpConfig, from, to, data, summary, trend }) {
  const transport = createTransport(smtpConfig);

  const periodStart = new Date(data.periodStart).toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const periodEnd = new Date(data.periodEnd).toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const subject = `${trend.arrow} Novedades Operativas | ${periodStart} – ${periodEnd} | Score ${summary.scoreActividad}/100`;

  const mailOptions = {
    from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text: buildText({ data, summary, trend }),
    html: buildHtml({ data, summary, trend }),
  };

  console.log(`[Emailer] Enviando email a: ${mailOptions.to}`);
  const info = await transport.sendMail(mailOptions);
  console.log(`[Emailer] Email enviado. MessageId: ${info.messageId}`);
  return info;
}
