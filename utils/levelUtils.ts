/**
 * utils/levelUtils.ts
 * 
 * Este es un archivo de "utilidades" o "ayudantes" (utils).
 * Contiene funciones puras y reutilizables que se encargan de toda la lógica
 * relacionada con los puntos, los niveles y el progreso de los usuarios.
 * 
 * Tener esta lógica separada aquí hace que el código sea más limpio y fácil de mantener.
 * Si las reglas de cómo se calculan los niveles cambian, solo necesitamos modificar este archivo.
 */

import { LEVELS, POINTS_PER_APPLAUSE } from '../constants'; // Importamos las reglas del juego.
import type { Redemption, Reward } from '../types'; // Importamos tipos para el cálculo de puntos netos.

/**
 * Calcula el total de puntos BRUTOS de un usuario basado en la cantidad de aplausos que ha recibido.
 * Este valor representa el total de reconocimiento acumulado.
 * @param applauseCount El número de aplausos recibidos.
 * @returns El total de puntos brutos.
 */
export const calculateGrossPoints = (applauseCount: number): number => {
  return applauseCount * POINTS_PER_APPLAUSE;
};

/**
 * Calcula los puntos NETOS (disponibles) de un usuario.
 * Toma los puntos brutos y resta el costo de las recompensas canjeadas,
 * excepto aquellas que han sido explícitamente rechazadas.
 * @param grossPoints El total de puntos brutos del usuario.
 * @param userRedemptions Un array con todos los canjes realizados por el usuario.
 * @param allRewards Un array con todas las recompensas disponibles en la plataforma.
 * @returns El saldo de puntos netos disponibles para gastar.
 */
export const calculateNetPoints = (
  grossPoints: number,
  userRedemptions: Redemption[],
  allRewards: Reward[]
): number => {
  // Filtramos los canjes para excluir aquellos que han sido 'Rechazado'.
  // Los puntos de canjes rechazados se devuelven efectivamente al usuario.
  const activeRedemptions = userRedemptions.filter(
    redemption => redemption.estado?.toLowerCase().trim() !== 'rechazado'
  );

  const spentPoints = activeRedemptions.reduce((total, redemption) => {
    // Buscamos la recompensa correspondiente al canje.
    const reward = allRewards.find(r => r.recompensa_id === redemption.recompensa_id);
    // Obtenemos el costo y lo convertimos a número. Si no se encuentra o no tiene costo, es 0.
    const cost = reward ? parseInt(reward.puntos_costo, 10) : 0;
    // Sumamos el costo al total de puntos gastados, asegurándonos de que no sea NaN.
    return total + (isNaN(cost) ? 0 : cost);
  }, 0);

  return grossPoints - spentPoints;
};

/**
 * Determina el nivel actual de un usuario según la cantidad de aplausos recibidos.
 * Recorre la lista de niveles y devuelve el nivel más alto que el usuario ha alcanzado.
 * @param applauseCount El número de aplausos recibidos.
 * @returns Un objeto con la información del nivel actual del usuario.
 */
export const getUserLevel = (applauseCount: number) => {
  let currentLevel = LEVELS[0]; // Empezamos asumiendo que el usuario está en el nivel más bajo.
  // Recorremos todos los niveles definidos en `constants`.
  for (const level of LEVELS) {
    if (applauseCount >= level.requiredApplause) {
      // Si el usuario tiene suficientes aplausos para este nivel, lo actualizamos.
      currentLevel = level;
    } else {
      // Si no tiene suficientes aplausos para el nivel actual, significa que no
      // alcanzará los siguientes, así que podemos detener la búsqueda.
      break;
    }
  }
  return currentLevel;
};

/**
 * Encuentra la información del siguiente nivel al que puede aspirar un usuario.
 * @param currentLevel El número del nivel actual del usuario.
 * @returns Un objeto con la información del siguiente nivel, o `null` si ya está en el nivel máximo.
 */
export const getNextLevelInfo = (currentLevel: number) => {
  // Buscamos en la lista de niveles el que sea `nivel actual + 1`.
  const nextLevel = LEVELS.find(l => l.level === currentLevel + 1);
  return nextLevel || null;
};

/**
 * Calcula el progreso del usuario hacia el siguiente nivel.
 * @param applauseCount El número de aplausos recibidos por el usuario.
 * @returns Un objeto con el porcentaje de progreso, cuántos aplausos faltan y el nombre del siguiente nivel.
 */
export const getProgressToNextLevel = (applauseCount: number) => {
  const currentLevelInfo = getUserLevel(applauseCount);
  const nextLevelInfo = getNextLevelInfo(currentLevelInfo.level);

  // Si no hay un siguiente nivel, significa que el usuario ha llegado al máximo.
  if (!nextLevelInfo) {
    return {
      progressPercentage: 100,
      needed: 0,
      nextLevelName: 'Máximo'
    };
  }

  // Calculamos cuántos aplausos ha conseguido el usuario DESDE que alcanzó su nivel actual.
  const applauseInCurrentLevel = applauseCount - currentLevelInfo.requiredApplause;
  // Calculamos cuántos aplausos se necesitan en total para pasar del nivel actual al siguiente.
  const applauseForNextLevel = nextLevelInfo.requiredApplause - currentLevelInfo.requiredApplause;
  // Calculamos el progreso como un porcentaje.
  const progressPercentage = (applauseInCurrentLevel / applauseForNextLevel) * 100;
  // Calculamos cuántos aplausos le faltan.
  const needed = nextLevelInfo.requiredApplause - applauseCount;

  return {
    progressPercentage,
    needed,
    nextLevelName: nextLevelInfo.name
  };
};