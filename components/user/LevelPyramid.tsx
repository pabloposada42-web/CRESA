import React from 'react';
import { LEVELS } from '../../constants';
import { getUserLevel, getProgressToNextLevel } from '../../utils/levelUtils';
import { Star } from 'lucide-react';

interface LevelPyramidProps {
  totalPoints: number;
}

const LevelPyramid: React.FC<LevelPyramidProps> = ({ totalPoints }) => {
  const userLevelInfo = getUserLevel(totalPoints);
  const progressInfo = getProgressToNextLevel(totalPoints);

  // Excluimos el nivel 0 y los ordenamos de MENOR a MAYOR para dibujar la pirámide de abajo hacia arriba.
  const pyramidLevels = LEVELS.filter(l => l.level > 0);
  const totalLevels = pyramidLevels.length;
  const pyramidHeight = 180; // Aumentamos la altura total para más espacio.
  const baseWidth = 200;
  const topWidth = 50;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Pirámide de Niveles</h2>
      <div className="relative w-full max-w-sm mx-auto" style={{ aspectRatio: '1 / 1' }}>
        <svg viewBox={`0 0 ${baseWidth} ${pyramidHeight}`} className="w-full h-full">
          {pyramidLevels.map((level, index) => {
            // Calculamos 'y' para que el nivel 1 esté en la base (parte inferior)
            const y = (totalLevels - 1 - index) * (pyramidHeight / totalLevels);
            const height = (pyramidHeight / totalLevels) - 4; // Aumentamos el espacio entre niveles
            
            // Calculamos el ancho de forma que disminuya linealmente hacia arriba (base ancha, cima estrecha).
            const width = baseWidth - (index * (baseWidth - topWidth)) / (totalLevels - 1);
            const x = (baseWidth - width) / 2;

            const isUnlocked = userLevelInfo.level >= level.level;
            const isCurrent = userLevelInfo.level === level.level;

            return (
              <g key={level.level} className="transition-opacity duration-500">
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx="3"
                  ry="3"
                  className={`transition-all duration-700 delay-150 ${isUnlocked ? 'fill-primary-500' : 'fill-gray-200 dark:fill-gray-700'}`}
                />
                <text
                  x={baseWidth / 2}
                  y={y + height / 2}
                  textAnchor="middle"
                  dy=".3em"
                  className={`font-bold text-sm pointer-events-none transition-colors duration-500 ${isUnlocked ? 'fill-white' : 'fill-gray-500 dark:fill-gray-400'}`}
                >
                  {level.name}
                </text>
                {isCurrent && (
                  <g className="animate-fade-in">
                    <Star
                      x={x + width - 20}
                      y={y + height / 2 - 10}
                      className="fill-yellow-400 stroke-yellow-500"
                      size={20}
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        {progressInfo.needed > 0
          ? `Faltan ${progressInfo.needed} Millas Extra para alcanzar el nivel de ${progressInfo.nextLevelName}.`
          : '¡Felicidades! Has alcanzado el nivel máximo.'}
      </p>
    </div>
  );
};

export default LevelPyramid;