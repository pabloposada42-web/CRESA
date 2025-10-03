/**
 * Leaderboard.tsx
 * 
 * Este componente se encarga de mostrar la "Tabla de Líderes", un ranking de los
 * usuarios con más puntos en la plataforma.
 * 
 * Responsabilidades:
 * - Recibir la lista completa de usuarios y aplausos.
 * - Calcular los puntos para cada usuario.
 * - Ordenar los usuarios de mayor a menor puntuación.
 * - Mostrar los 10 mejores en una tabla.
 * - Resaltar la fila del usuario que está viendo la tabla.
 */

import React, { useMemo } from 'react';
import type { User, Applause } from '../../types';
import { calculateGrossPoints } from '../../utils/levelUtils';
import Card from '../common/Card';

// Define las propiedades que el componente necesita.
interface LeaderboardProps {
  users: User[];
  applause: Applause[];
  currentUser: User; // El usuario que está actualmente logueado.
}

const Leaderboard: React.FC<LeaderboardProps> = ({ users, applause, currentUser }) => {

  // `useMemo` es un hook de optimización de React.
  // La lógica para calcular el leaderboard puede ser pesada si hay muchos usuarios.
  // `useMemo` "memoriza" el resultado del cálculo. La próxima vez que el componente se renderice,
  // si `users` y `applause` no han cambiado, React reutilizará el resultado memorizado
  // en lugar de volver a calcular todo desde cero. Esto hace la aplicación más rápida.
  const leaderboardData = useMemo(() => {
    return users
      // Filtramos para incluir solo usuarios activos que no sean administradores.
      .filter(u => u.rol !== 'admin' && u.estado === 'activo')
      // Para cada usuario, calculamos sus puntos.
      .map(user => {
        const receivedApplauseCount = applause.filter(a => a.receptor_id === user.usuario_id).length;
        return {
          ...user,
          points: calculateGrossPoints(receivedApplauseCount, user.puntos_anteriores),
        };
      })
      // Ordenamos los usuarios por puntos, de mayor a menor.
      .sort((a, b) => b.points - a.points)
      // Nos quedamos solo con los 10 primeros.
      .slice(0, 10);
  }, [users, applause]); // La recalculación solo se hará si `users` o `applause` cambian.

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Tabla de Líderes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Posición
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Colaborador
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Puntos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {/* Mapeamos los datos del leaderboard para crear una fila <tr> por cada usuario. */}
              {leaderboardData.map((user, index) => (
                // La clase de la fila cambia si el ID del usuario coincide con el del currentUser.
                <tr key={user.usuario_id} className={user.usuario_id === currentUser.usuario_id ? 'bg-primary-50 dark:bg-primary-900/50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-bold">{user.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default Leaderboard;