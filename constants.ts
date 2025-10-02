/**
 * constants.ts
 * 
 * Este archivo es el hogar de los "valores mágicos" y las reglas de negocio de la aplicación.
 * En lugar de escribir números o textos directamente en el código (lo que puede ser confuso),
 * los definimos aquí con un nombre claro.
 * 
 * Por ejemplo, en lugar de escribir `100` en varios lugares, creamos `POINTS_PER_APPLAUSE`.
 * Si alguna vez queremos cambiar las reglas (ej. que un aplauso valga 150 puntos),
 * solo tenemos que cambiarlo en este único lugar.
 */

import type { Badge } from './types';

// Regla de Puntuación: Cada aplauso recibido otorga 100 puntos.
export const POINTS_PER_APPLAUSE = 100;

// Definición de Niveles: Define los diferentes niveles que un usuario puede alcanzar.
// Cada objeto representa un nivel, su nombre y cuántos aplausos se necesitan para llegar a él.
export const LEVELS = [
  { level: 0, name: 'Novato', requiredApplause: 0 },
  { level: 1, name: 'Aprendiz', requiredApplause: 2 },
  { level: 2, name: 'Participante', requiredApplause: 4 },
  { level: 3, name: 'Contribuidor', requiredApplause: 6 },
  { level: 4, name: 'Mentor', requiredApplause: 8 },
  { level: 5, name: 'Líder', requiredApplause: 10 },
  { level: 6, name: 'Leyenda', requiredApplause: 12 },
];

// Definición de Insignias: Contiene la información de todas las insignias posibles.
// Cada insignia está asociada a un "principio" (un valor de la empresa).
export const BADGE_DEFINITIONS: Omit<Badge, 'count'>[] = [
    { name: 'Maestro de la Innovación', principle: 'Innovación', description: 'Premiado por ideas creativas que rompen esquemas y mejoran procesos.' },
    { name: 'Campeón del Cliente', principle: 'Foco en el Cliente', description: 'Destacado por ir más allá para satisfacer y deleitar a los clientes.' },
    { name: 'Colaborador Estrella', principle: 'Trabajo en Equipo', description: 'Celebrado por fomentar un ambiente de cooperación y apoyo mutuo.' },
    { name: 'Ejecutor Impecable', principle: 'Excelencia', description: 'Reconocido por entregar resultados de alta calidad de manera consistente.' },
    { name: 'Pilar de Integridad', principle: 'Integridad', description: 'Premiado por actuar siempre con honestidad, transparencia y ética.' },
];

// Regla para Ganar Insignias: Se necesitan 3 aplausos del mismo principio para ganar la insignia correspondiente.
export const BADGE_THRESHOLD = 3;