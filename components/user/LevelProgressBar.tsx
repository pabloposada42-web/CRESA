/**
 * LevelProgressBar.tsx
 * 
 * Este es un componente específico para el usuario. Su única función es mostrar
 * una barra de progreso visual que indica qué tan cerca está el usuario de
 * alcanzar el siguiente nivel.
 * 
 * Utiliza las funciones de `levelUtils` para hacer todos los cálculos necesarios.
 * Esto es un buen ejemplo de cómo separamos la lógica (los cálculos en `utils`)
 * de la presentación (lo que se ve en pantalla en este componente).
 */
import React from 'react';
import { getProgressToNextLevel, getUserLevel } from '../../utils/levelUtils';

// Definimos las propiedades que necesita este componente.
interface LevelProgressBarProps {
  applauseCount: number; // El número total de aplausos que ha recibido el usuario.
}

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ applauseCount }) => {
  // Llamamos a las funciones de utilidad para obtener toda la información que necesitamos.
  const levelInfo = getUserLevel(applauseCount); // ¿Cuál es el nivel actual?
  const progressInfo = getProgressToNextLevel(applauseCount); // ¿Cuál es el progreso hacia el siguiente?

  return (
    <div>
      {/* Muestra el nombre del nivel actual y el nombre del siguiente nivel. */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Nivel {levelInfo.level}: {levelInfo.name}</span>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Siguiente: {progressInfo.nextLevelName}
        </span>
      </div>
      {/* La barra de progreso contenedora (la parte gris de fondo). */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        {/* La barra de progreso que se llena (la parte de color). */}
        <div
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
          // El ancho de esta barra se establece dinámicamente con el porcentaje calculado.
          style={{ width: `${progressInfo.progressPercentage}%` }}
        ></div>
      </div>
      {/* Un pequeño texto que indica cuántos aplausos faltan para el siguiente nivel. */}
      <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
        {progressInfo.needed > 0
          ? `Faltan ${progressInfo.needed} aplausos para el siguiente nivel.`
          : '¡Has alcanzado el nivel máximo!'}
      </p>
    </div>
  );
};

export default LevelProgressBar;