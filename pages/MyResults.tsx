/**
 * MyResults.tsx
 * 
 * Esta página es el panel de "Mis Resultados" del usuario. Es una vista detallada
 * de todo su progreso, logros e historial dentro de la plataforma.
 * 
 * Responsabilidades:
 * - Calcular y mostrar estadísticas clave (Puntos totales, Nivel, Insignias ganadas).
 * - Mostrar un gráfico de barras con el progreso de aplausos recibidos por mes.
 * - Mostrar la galería completa de insignias (`BadgeGallery`), destacando las ganadas.
 * - Presentar un historial detallado de los aplausos recibidos.
 * - Presentar un historial de las recompensas que el usuario ha canjeado.
 */

import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Card from '../components/common/Card';
import BadgeGallery from '../components/user/BadgeGallery';
import { calculateEarnedBadges } from '../utils/badgeUtils';
import { getUserLevel, calculateGrossPoints, calculateNetPoints } from '../utils/levelUtils';
import ApplauseChart from '../components/user/ApplauseChart';

const MyResults: React.FC = () => {
  const { user } = useAuth();
  const { applause, users, redemptions, rewards } = useData();

  if (!user) return null;

  // Usamos `useMemo` para optimizar los cálculos, ya que solo se recalcularán si los datos base cambian.
  const receivedApplause = useMemo(() => applause.filter(a => a.receptor_id === user.usuario_id), [applause, user.usuario_id]);
  const earnedBadges = useMemo(() => calculateEarnedBadges(receivedApplause), [receivedApplause]);
  const levelInfo = getUserLevel(receivedApplause.length);

  // Lógica de Puntos Netos: Calculamos los puntos disponibles después de los canjes.
  const userRedemptions = useMemo(() => redemptions.filter(r => r.usuario_id === user.usuario_id), [redemptions, user.usuario_id]);
  const grossPoints = calculateGrossPoints(receivedApplause.length);
  const netPoints = calculateNetPoints(grossPoints, userRedemptions, rewards);


  // Lógica para agrupar los aplausos recibidos por mes para el gráfico.
  const applauseByMonth = useMemo(() => {
    const months: { [key: string]: { count: number; label: string } } = {};
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    receivedApplause.forEach(a => {
      const date = new Date(a.fecha);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${String(month).padStart(2, '0')}`; // Formato 'YYYY-MM'
      const monthLabel = `${monthNames[month]} '${String(year).slice(2)}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { count: 0, label: monthLabel };
      }
      months[monthKey].count++;
    });

    return Object.entries(months)
      .map(([key, value]) => ({ name: value.label, aplausos: value.count, key }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [receivedApplause]);
  
  // Filtramos los canjes que pertenecen al usuario actual.
  const sortedUserRedemptions = userRedemptions.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Funciones de ayuda para obtener nombres a partir de IDs.
  const getUsername = (id: string) => users.find(u => u.usuario_id === id)?.nombre || 'Desconocido';
  const getRewardName = (id: string) => rewards.find(r => r.recompensa_id === id)?.nombre || 'Recompensa Desconocida';
  
  const formatSafeDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return !isNaN(date.getTime())
        ? date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Fecha no disponible';
  };

  const getStatusBadge = (status?: string) => {
    const normalizedStatus = status?.toLowerCase().trim();
    switch (normalizedStatus) {
        case 'aprobado':
            return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case 'pendiente':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case 'rechazado':
            return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mis Resultados</h1>
      
      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6"><div className="text-center"><p className="text-sm text-gray-500 dark:text-gray-400">Puntos Disponibles</p><p className="text-3xl font-bold">{netPoints}</p></div></Card>
        <Card className="p-6"><div className="text-center"><p className="text-sm text-gray-500 dark:text-gray-400">Nivel Actual</p><p className="text-3xl font-bold">{levelInfo.level}: {levelInfo.name}</p></div></Card>
        <Card className="p-6"><div className="text-center"><p className="text-sm text-gray-500 dark:text-gray-400">Insignias Ganadas</p><p className="text-3xl font-bold">{earnedBadges.filter(b => b.earned).length}</p></div></Card>
      </div>

      {/* Gráfico de progreso mensual */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Progreso Mensual de Aplausos</h3>
        <ApplauseChart data={applauseByMonth} />
      </Card>
      
      {/* Galería de insignias */}
      <Card className="p-6">
        <BadgeGallery earnedBadges={earnedBadges} userName={user.nombre} />
      </Card>

      {/* Historiales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Historial de Aplausos Recibidos</h3>
          {receivedApplause.length > 0 ? (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {receivedApplause.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(a => (
                <li key={a.aplauso_id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="font-semibold text-primary-700 dark:text-primary-300">De: {getUsername(a.otorgante_id)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 my-1">"{a.motivo}"</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-900/50 px-2 py-0.5 rounded-full">{a.principio}</span>
                    <span className="text-xs text-gray-400">{new Date(a.fecha).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (<p className="text-sm text-gray-500 dark:text-gray-400">Aún no has recibido aplausos.</p>)}
        </Card>
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Historial de Canjes</h3>
          {sortedUserRedemptions.length > 0 ? (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {sortedUserRedemptions.map(r => (
                <li key={r.canje_id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold truncate pr-2">{getRewardName(r.recompensa_id)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusBadge(r.estado)}`}>
                        {r.estado || 'No especificado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400">Cód: {r.canje_id}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {formatSafeDate(r.fecha)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (<p className="text-sm text-gray-500 dark:text-gray-400">Aún no has canjeado recompensas.</p>)}
        </Card>
      </div>
    </div>
  );
};

export default MyResults;