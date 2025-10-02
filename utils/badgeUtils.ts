/**
 * badgeUtils.ts
 * 
 * Este archivo de utilidades se especializa en todo lo relacionado con las insignias (badges).
 * Su principal responsabilidad es determinar qué insignias ha ganado un usuario
 * basándose en el historial de aplausos que ha recibido.
 */

import type { Applause, EarnedBadge } from '../types';
import { BADGE_DEFINITIONS, BADGE_THRESHOLD } from '../constants'; // Importamos las definiciones y reglas de las insignias.

/**
 * Calcula y devuelve una lista de todas las insignias, indicando cuáles ha ganado el usuario
 * y la fecha exacta en que se consiguió el logro.
 * @param receivedApplause Un array con todos los aplausos que el usuario ha recibido.
 * @returns Un array de objetos `EarnedBadge`, que contiene la información de cada insignia
 *          y un campo `earned` que es `true` si el usuario cumple los requisitos.
 */
export const calculateEarnedBadges = (receivedApplause: Applause[]): EarnedBadge[] => {
  // Usamos un objeto (mapa) para agrupar todos los aplausos por su principio.
  // Esto es más eficiente que filtrar la lista completa por cada insignia.
  // Ej: { "Liderazgo": [aplauso1, aplauso2], "Innovacion": [aplauso3] }
  const applauseByPrinciple: Record<string, Applause[]> = {};

  for (const applause of receivedApplause) {
    if (!applauseByPrinciple[applause.principio]) {
      applauseByPrinciple[applause.principio] = [];
    }
    applauseByPrinciple[applause.principio].push(applause);
  }

  // Ahora, recorremos cada tipo de insignia definida en `constants`.
  return BADGE_DEFINITIONS.map(badgeDef => {
    // Obtenemos la lista de aplausos para el principio de esta insignia.
    const relevantApplause = applauseByPrinciple[badgeDef.principle] || [];
    const count = relevantApplause.length;
    
    // Verificamos si la cantidad de aplausos es suficiente para ganar la insignia.
    const earned = count >= BADGE_THRESHOLD;
    let earnedDate: string | undefined = undefined;

    // Si la insignia se ha ganado, necesitamos encontrar la fecha exacta del logro.
    if (earned) {
      // Ordenamos los aplausos de este principio por fecha, del más antiguo al más reciente.
      const sortedApplause = [...relevantApplause].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      // La fecha de logro es la fecha del aplauso que cumplió el requisito.
      // Si el umbral es 3, será la fecha del tercer aplauso (índice 2).
      earnedDate = sortedApplause[BADGE_THRESHOLD - 1].fecha;
    }
    
    // Devolvemos el objeto completo de la insignia con los datos calculados.
    return {
      ...badgeDef,
      count,
      earned,
      earnedDate,
    };
  });
};