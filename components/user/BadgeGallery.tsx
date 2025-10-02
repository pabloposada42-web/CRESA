/**
 * BadgeGallery.tsx
 * 
 * Este componente se encarga de mostrar una "Galería de Insignias" interactiva.
 * Muestra todas las insignias posibles, resalta las ganadas, y permite al usuario
 * hacer clic en ellas para ver más detalles y compartirlas.
 */

import React, { useState } from 'react';
import type { EarnedBadge } from '../../types';
import { Award, CheckCircle } from 'lucide-react';
import BadgeDetailModal from './BadgeDetailModal'; // Importamos el nuevo modal.
import Card from '../common/Card';

interface BadgeGalleryProps {
  earnedBadges: EarnedBadge[];
  userName: string;
}

const BadgeGallery: React.FC<BadgeGalleryProps> = ({ earnedBadges, userName }) => {
  const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | null>(null);

  const handleBadgeClick = (badge: EarnedBadge) => {
    if (badge.earned) {
      setSelectedBadge(badge);
    }
  };

  return (
    <>
      <h3 className="text-xl font-bold mb-4">Galería de Insignias</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {earnedBadges.map(badge => (
          <button 
            key={badge.name} 
            onClick={() => handleBadgeClick(badge)}
            disabled={!badge.earned}
            className={`p-4 border rounded-lg text-center transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-primary-500
            ${badge.earned 
              ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/30 hover:shadow-lg hover:-translate-y-1 cursor-pointer' 
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60 cursor-not-allowed'}`}
          >
            <div className="relative inline-block">
              <Award className={`mx-auto h-12 w-12 ${badge.earned ? 'text-secondary-500' : 'text-gray-400'}`} />
              {badge.earned && (
                <CheckCircle className="absolute -top-1 -right-1 h-5 w-5 text-green-500 bg-white dark:bg-secondary-900/30 rounded-full" />
              )}
            </div>
            <h4 className="mt-2 font-semibold text-sm">{badge.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
          </button>
        ))}
      </div>

      {/* Renderizamos el modal de detalle. Solo se muestra si hay una insignia seleccionada. */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
          userName={userName}
        />
      )}
    </>
  );
};

export default BadgeGallery;