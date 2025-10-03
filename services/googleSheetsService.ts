/**
 * googleSheetsService.ts
 * 
 * Este archivo es el "conector" de nuestra aplicación con el mundo exterior,
 * específicamente con las hojas de cálculo de Google Sheets que actúan como nuestra base de datos.
 * 
 * Su misión es:
 * 1.  Obtener los datos desde una URL pública de Google Sheets.
 * 2.  "Traducir" esos datos, que vienen en formato de texto (CSV), a un formato que
 *     JavaScript pueda entender y usar (un array de objetos).
 * 3.  Manejar datos de prueba (placeholders) para las tablas que aún no están conectadas en vivo.
 */
import type { User, Applause, Reward, Redemption } from '../types';
import { 
  SHEETS_USERS_URL, 
  SHEETS_APPLAUSE_URL, 
  SHEETS_REWARDS_URL, 
  SHEETS_REDEMPTIONS_URL 
} from '../config';

/**
 * El "traductor" de CSV.
 * Convierte un texto plano separado por comas en un array de objetos.
 * Es inteligente y puede manejar campos que contienen comas si están entre comillas.
 * @param csvText El texto en formato CSV.
 * @returns Un array de objetos, donde cada objeto es una fila de la hoja de cálculo.
 */
const parseCSV = <T extends object>(csvText: string): T[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  // FIX DEFINITIVO: Proceso de limpieza de encabezados mucho más robusto.
  // Esto soluciona problemas de inconsistencias de mayúsculas/minúsculas, espacios
  // o caracteres especiales en los nombres de las columnas de Google Sheets.
  const header = (lines[0].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(h => 
    h
      .trim() // Quita espacios al inicio y final
      .replace(/^"|"$/g, '') // Quita comillas al inicio y final
      .replace(/\uFEFF/g, '') // Quita el Byte Order Mark (caracter invisible)
      .toLowerCase() // Convierte todo a minúsculas
      .replace(/[^a-z0-9_]/g, '_') // Reemplaza CUALQUIER caracter no válido por un guion bajo
      .replace(/_+/g, '_') // Colapsa múltiples guiones bajos a uno solo
      .replace(/_$/, '') // Elimina el guion bajo al final si existe (ej. 'estado:' se convierte en 'estado')
  );
  
  const rows = lines.slice(1);
  
  return rows.map(row => {
    const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const entry = {} as T;
    header.forEach((key, i) => {
      let value = (values[i] || '').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      entry[key as keyof T] = value as any;
    });
    return entry;
  });
};

/**
 * Función de transformación para los datos de usuario.
 * Normaliza los datos, mapea columnas y roles para asegurar la compatibilidad con la app.
 * Esta lógica es flexible para reconocer correctamente el rol 'otorgador'.
 */
const transformUsers = (users: any[]): User[] => {
    return users.map(user => {
        const rawRole = (user.rol_otorgador || user.rol || '').toLowerCase().trim();
        let assignedRole: User['rol'];

        if (rawRole === 'administrador' || rawRole === 'admin') {
            assignedRole = 'admin';
        } else if (rawRole === 'colaborador' || rawRole === 'lector' || rawRole === '') {
            // Si el rol es 'colaborador', 'lector', o está vacío, se asigna 'colaborador'.
            assignedRole = 'colaborador';
        } else {
            // Cualquier otro rol no vacío (ej. 'Editor', 'Otorgador') se considera 'otorgador'.
            // Esto asegura que el botón de dar aplauso aparezca.
            assignedRole = 'otorgador';
        }

        // FIX: Explicitly define properties to ensure type safety, removing the `...user` spread on `any`.
        return {
            usuario_id: String(user.usuario_id || ''),
            nombre: String(user.nombre || ''),
            email: String(user.email || ''),
            clave_hash: String(user.clave_hash || ''),
            rol: assignedRole,
            estado: (user.estado || '').toLowerCase() === 'activo' ? 'activo' : 'inactivo',
            fecha_creacion: user.fecha_creacion || new Date().toISOString(),
            puntos_anteriores: Number(user.puntos_anteriores) || 0, // Lee los puntos anteriores, si no, 0.
        };
    });
};

/**
 * Parsea una fecha en varios formatos (DD/MM/YYYY, YYYY-MM-DD, ISO 8601) de forma robusta.
 * Es capaz de manejar fechas que incluyen la hora.
 * @param dateString La fecha en formato de texto.
 * @returns Un objeto Date válido o null.
 */
const parseDateString = (dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null;
    
    // Intenta interpretar la fecha directamente. Esto maneja formatos ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
    const isoDate = new Date(dateString.trim());
    if (!isNaN(isoDate.getTime())) {
        return isoDate;
    }

    const datePart = dateString.trim().split(' ')[0];
    
    // Intenta formato DD/MM/YYYY
    const dmyMatch = datePart.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
        const [, day, month, year] = dmyMatch.map(Number);
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime()) && date.getDate() === day) {
            return date;
        }
    }

    // Intenta formato YYYY-MM-DD
    const ymdMatch = datePart.match(/^\d{4}-\d{2}-\d{2}$/);
    if (ymdMatch) {
        const [year, month, day] = datePart.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime()) && date.getDate() === day) {
            return date;
        }
    }

    return null;
};


/**
 * Función de transformación para los datos de aplausos.
 * Normaliza las fechas a formato ISO para evitar errores de parsing.
 */
const transformApplause = (applauses: any[]): Applause[] => {
    return applauses.map(applause => {
        const parsedDate = parseDateString(applause.fecha);
        // FIX: Explicitly define properties to ensure type safety, removing the `...applause` spread on `any`.
        return {
            aplauso_id: String(applause.aplauso_id || ''),
            otorgante_id: String(applause.otorgante_id || ''),
            receptor_id: String(applause.receptor_id || ''),
            principio: String(applause.principio || ''),
            motivo: String(applause.motivo || ''),
            fecha: parsedDate ? parsedDate.toISOString() : String(applause.fecha || ''),
        };
    });
};

/**
 * Función de transformación para los datos de recompensas.
 * Limpia los IDs para asegurar consistencia en las comparaciones.
 */
// FIX: The previous implementation used a spread on an `any` object, which caused type instability.
// This new implementation explicitly creates the Reward object, ensuring all properties are correctly typed as strings.
const transformRewards = (rewards: any[]): Reward[] => {
    return rewards.map(reward => ({
        recompensa_id: String(reward.recompensa_id || '').trim(),
        nombre: String(reward.nombre || ''),
        descripcion: String(reward.descripcion || ''),
        nivel_requerido: String(reward.nivel_requerido || '0'),
        imagen_url: String(reward.imagen_url || ''),
        stock: String(reward.stock || '0'),
        puntos_costo: String(reward.puntos_costo || '0'),
    }));
};

/**
 * Función de transformación para los datos de canjes.
 * Limpia los IDs y normaliza las fechas para asegurar consistencia.
 */
const transformRedemptions = (redemptions: any[]): Redemption[] => {
    return redemptions.map(redemption => {
        const parsedDate = parseDateString(redemption.fecha);
        // FIX: Explicitly define properties to ensure type safety, removing the `...redemption` spread on `any`.
        return {
            canje_id: String(redemption.canje_id || ''),
            usuario_id: String(redemption.usuario_id || ''),
            recompensa_id: String(redemption.recompensa_id || '').trim(),
            fecha: parsedDate ? parsedDate.toISOString() : String(redemption.fecha || ''),
            nivel_requerido: redemption.nivel_requerido,
            puntos_requeridos: redemption.puntos_requeridos,
            puntos_previos: redemption.puntos_previos,
            puntos_restantes: redemption.puntos_restantes,
            estado: redemption.estado,
            comprobante_pdf_url: redemption.comprobante_pdf_url,
            observaciones: redemption.observaciones,
        };
    });
};

// Lista de proxies para mejorar la resiliencia de la conexión.
// La aplicación intentará conectar con ellos en orden hasta que uno funcione.
const PROXIES = [
  'https://corsproxy.io/?{URL}',
  'https://api.allorigins.win/raw?url={URL}',
];

/**
 * Busca datos en una URL de forma resiliente, probando varios proxies.
 * @param url La dirección de internet donde está el archivo CSV.
 * @returns Una Promesa que se resuelve con los datos ya "traducidos" por parseCSV.
 */
const fetchFromUrl = async <T extends object>(url: string, transform?: (data: any[]) => T[]): Promise<T[]> => {
  const encodedUrl = encodeURIComponent(url);
  
  for (const proxyTemplate of PROXIES) {
    const proxyUrl = proxyTemplate.replace('{URL}', encodedUrl);
    try {
      const response = await fetch(proxyUrl, { cache: 'no-store' });
      if (response.ok) {
        console.log(`Conexión exitosa a través de: ${proxyTemplate.split('/')[2]}`);
        const csvText = await response.text();
        const parsedData = parseCSV<T>(csvText);
        return transform ? transform(parsedData) : parsedData;
      }
      console.warn(`Falló la conexión con ${proxyTemplate.split('/')[2]} (Status: ${response.status}). Probando el siguiente...`);
    } catch (error) {
      console.warn(`Error de red con ${proxyTemplate.split('/')[2]}. Probando el siguiente...`, error);
    }
  }

  // Si todos los proxies fallan, lanzamos un error definitivo.
  throw new Error(`No se pudo conectar a Google Sheets a través de ninguno de los proxies.`);
};

// FIX: Export 'getGoogleSheetsData' function to be used in DataContext.
/**
 * Obtiene todos los datos de las hojas de cálculo de Google Sheets de forma paralela.
 * @returns Un objeto que contiene arrays de usuarios, aplausos, recompensas y canjes.
 */
export const getGoogleSheetsData = async () => {
    const [users, applause, rewards, redemptions] = await Promise.all([
      fetchFromUrl<User>(SHEETS_USERS_URL, transformUsers),
      fetchFromUrl<Applause>(SHEETS_APPLAUSE_URL, transformApplause),
      fetchFromUrl<Reward>(SHEETS_REWARDS_URL, transformRewards),
      fetchFromUrl<Redemption>(SHEETS_REDEMPTIONS_URL, transformRedemptions),
    ]);
  
    return { users, applause, rewards, redemptions };
};