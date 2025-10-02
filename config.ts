/**
 * config.ts
 * 
 * Este archivo centraliza la configuración de la aplicación, como las URLs
 * de las hojas de cálculo de Google Sheets.
 * 
 * Separar la configuración de la lógica de la aplicación es una buena práctica.
 * Hace que sea más fácil de gestionar y actualizar sin tener que buscar
 * valores "hardcodeados" por todo el código.
 * 
 * ---
 * ¡IMPORTANTE!
 * Reemplaza las siguientes URLs de ejemplo con las URLs reales de tus
 * hojas de cálculo publicadas como CSV.
 * ---
 */

// URL para la hoja de cálculo de Usuarios
export const SHEETS_USERS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3jUz7D5Jrkfdihj2TOSfy3Qh6cwuC8DxWDGn9681iMJZBqvn9isjRzXQrC_gXAS7lMGgGBf-Ke9VN/pub?gid=0&single=true&output=csv";

// URL para la hoja de cálculo de Aplausos
export const SHEETS_APPLAUSE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3jUz7D5Jrkfdihj2TOSfy3Qh6cwuC8DxWDGn9681iMJZBqvn9isjRzXQrC_gXAS7lMGgGBf-Ke9VN/pub?gid=1558897545&single=true&output=csv";

// URL para la hoja de cálculo de Recompensas
export const SHEETS_REWARDS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3jUz7D5Jrkfdihj2TOSfy3Qh6cwuC8DxWDGn9681iMJZBqvn9isjRzXQrC_gXAS7lMGgGBf-Ke9VN/pub?gid=756377319&single=true&output=csv";

// URL para la hoja de cálculo de Canjes
export const SHEETS_REDEMPTIONS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3jUz7D5Jrkfdihj2TOSfy3Qh6cwuC8DxWDGn9681iMJZBqvn9isjRzXQrC_gXAS7lMGgGBf-Ke9VN/pub?gid=2139962816&single=true&output=csv";

// URL para el formulario externo de SharePoint para dar aplausos.
// ¡IMPORTANTE! Reemplaza esta URL de ejemplo por la URL real de tu formulario.
export const SHAREPOINT_FORM_URL = "https://creditoseconomicos-my.sharepoint.com/personal/pablo_posada_cresa_ec/_layouts/15/listforms.aspx?cid=YzAzNDUxNTItMmE2Yi00YTVlLWFjYzctYzVhNmY4MzEwN2Fk&nav=YzcwYjg0Y2UtMmEzMC00MTBhLWFhMTktZmJkYjcxZWNiZTg2";