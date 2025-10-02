/**
 * RewardCard.tsx
 * 
 * Este componente se especializa en mostrar una única tarjeta de recompensa
 * dentro del Marketplace.
 * 
 * Responsabilidades:
 * - Mostrar la imagen, nombre, descripción y nivel requerido de una recompensa.
 * - Determinar si el usuario actual tiene el nivel suficiente para canjear la recompensa.
 * - Deshabilitar visualmente y funcionalmente el botón de "Canjear" si el usuario no
 *   cumple con el nivel requerido.
 * - Llamar a una función (`onRedeem`) cuando el usuario hace clic en el botón de canjear.
 */

import React from 'react';
import type { Reward } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';

// Define las propiedades que necesita el componente.
interface RewardCardProps {
  reward: Reward;       // El objeto con la información de la recompensa a mostrar.
  userLevel: number;    // El nivel actual del usuario que está viendo la tarjeta.
  userPoints: number;   // Los puntos disponibles del usuario.
  onRedeem: (reward: Reward) => void; // La función que se ejecutará al hacer clic en canjear.
  availableStock: number; // La cantidad de stock disponible.
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, userLevel, userPoints, onRedeem, availableStock }) => {
  // Verificamos si la recompensa está agotada.
  const isOutOfStock = availableStock <= 0;
  // Verificamos si el usuario cumple con el nivel requerido.
  const hasRequiredLevel = userLevel >= parseInt(reward.nivel_requerido);
  // Verificamos si el usuario tiene puntos suficientes.
  const cost = parseInt(reward.puntos_costo, 10) || 0;
  const hasEnoughPoints = userPoints >= cost;

  // El usuario puede canjear solo si cumple todas las condiciones.
  const canRedeem = hasRequiredLevel && !isOutOfStock && hasEnoughPoints;

  let buttonText = 'Canjear';
  if (isOutOfStock) {
    buttonText = 'Agotado';
  } else if (!hasRequiredLevel) {
    buttonText = 'Nivel Insuficiente';
  } else if (!hasEnoughPoints) {
    buttonText = 'Puntos Insuficientes';
  }


  return (
    // Usamos el componente Card como base.
    // Si está agotado, aplicamos un filtro de escala de grises.
    <Card className={`flex flex-col h-full relative transition-shadow duration-300 hover:shadow-xl ${isOutOfStock ? 'grayscale' : ''}`}>
      {isOutOfStock && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          AGOTADO
        </div>
      )}
      <img src={reward.imagen_url} alt={reward.nombre} className="w-full h-40 object-cover" />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{reward.nombre}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Nivel Requerido: {reward.nivel_requerido}</p>
        <p className="text-sm text-gray-500 dark:text-gray-300 mt-2 flex-grow">{reward.descripcion}</p>
        
        {/* Costo en Puntos */}
        <div className="text-center my-2">
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{cost}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">puntos</span>
        </div>

        {!isOutOfStock && (
            <p className="text-xs text-center font-medium text-gray-500 dark:text-gray-400 mt-2">
                Quedan {availableStock} disponibles
            </p>
        )}

        <Button 
            className="w-full mt-4" 
            onClick={() => onRedeem(reward)}
            disabled={!canRedeem} // El botón se deshabilita si `canRedeem` es falso.
        >
          {buttonText}
        </Button>
      </div>
    </Card>
  );
};

export default RewardCard;